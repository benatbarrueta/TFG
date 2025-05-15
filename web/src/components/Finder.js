import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './../styles/Finder.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import MapModal from './MapModal';

const Finder = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { imageUrl, fromMap, imageName } = location.state || {};
    const searchParams = new URLSearchParams(location.search);
    const imageParam = searchParams.get('image');

    const [errorMessage, setErrorMessage] = useState('');
    const [imagePath, setImagePath] = useState('');
    const [apiResult, setApiResult] = useState([]);
    const [base64Image, setBase64Image] = useState('');
    const [loadingPlant, setLoadingPlant] = useState(false);
    const [loadingAnimal, setLoadingAnimal] = useState(false);
    const [loadingFootprint, setLoadingFootprint] = useState(false);
    const [showPreview, setShowPreview] = useState('');
    const [question, setQuestion] = useState("");
    const [placeholder, setPlaceholder] = useState("Pregunta algo sobre la imagen analizada...");
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [chatResults, setChatResults] = useState([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentContext, setCurrentContext] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [imageSaved, setImageSaved] = useState(false);
    const chatContainerRef = useRef(null);

    //console.log(imageUrl);

    useEffect(() => {
        setErrorMessage('');
        setImagePath('');
        setApiResult([]);
        setBase64Image('');
    }, []); // Add empty dependency array to run only on mount

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    };

    useEffect(() => {
        if (imageParam) {
            setShowPreview(imageParam);
            fetch(imageParam)
                .then(res => res.blob())
                .then(blob => convertFileToBase64(blob))
                .then(base64 => setBase64Image(base64))
                .catch(error => console.error('Error converting image to base64:', error));
        } else if (imageUrl) {
            setShowPreview(imageUrl);
            fetch(imageUrl)
                .then(res => res.blob())
                .then(blob => convertFileToBase64(blob))
                .then(base64 => setBase64Image(base64))
                .catch(error => console.error('Error converting image to base64:', error));
        }
    }, [imageUrl, imageParam]);

    // Añadir useEffect para obtener la ubicación cuando se monte el componente
    useEffect(() => {
        const getLocation = async () => {
            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            resolve,
                            reject,
                            {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 0
                            }
                        );
                    });
                    
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                } catch (error) {
                    let errorMsg = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = "Usuario denegó el acceso a la ubicación.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = "La información de ubicación no está disponible.";
                            break;
                        case error.TIMEOUT:
                            errorMsg = "Se agotó el tiempo para obtener la ubicación.";
                            break;
                        default:
                            errorMsg = "Error desconocido al obtener la ubicación.";
                    }
                    console.error("Error obteniendo la ubicación:", errorMsg);
                    setErrorMessage(errorMsg);
                }
            } else {
                const msg = "Tu navegador no soporta geolocalización.";
                console.error(msg);
                setErrorMessage(msg);
            }
        };

        getLocation();
    }, []);

    useEffect(() => {
        if (fromMap && imageUrl && imageName) {
            // Si viene del mapa, añadimos el resultado con el nombre/identificación de la imagen
            setApiResult([{
                imageName: 'Imagen del mapa',
                result: imageName,
                preview: imageUrl
            }]);
            setCurrentContext(`imagen identificada: ${imageName}`);
            setImageSaved(true);
        }
    }, [fromMap, imageUrl, imageName]);

    // Llama a la API
    const apiCall = async (image, link) => {
        try {
            console.log(link);
            const response = await axios.post(`https://ecotrack.es/nature/${link}`,
                {
                    image_path: image
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.data.result;
        } catch (error) {
            console.error('Error al llamar a la API:', error);
            throw new Error('Error en la consulta a la API');
        }
    };

    // Maneja la consulta de la API
    const handleApiCall = async (link) => {
        if (!base64Image) {
            setErrorMessage('Primero selecciona una imagen válida.');
            return;
        }

        if (link === "getPlant") {
            setLoadingPlant(true);
        } else if (link === "getAnimal") {
            setLoadingAnimal(true);
        } else if (link === "getAnimalByFootprint") {
            setLoadingFootprint(true);
        }

        try {
            const result = await apiCall(base64Image, link);
            
            let contextType = "";
            if (link === "getPlant") contextType = "planta";
            else if (link === "getAnimal") contextType = "animal";
            else if (link === "getAnimalByFootprint") contextType = "huella";
            
            setCurrentContext(`${contextType} en la imagen: ${result}`);
            
            setApiResult((prevResults) => [
                ...prevResults,
                { imageName: imagePath, result, preview: imageUrl }
            ]);

            // Si viene del mapa, automáticamente iniciamos una conversación
            if (fromMap) {
                const initialQuestion = `¿Qué ${contextType} es esta?`;
                handleChatQuestion(initialQuestion);
            }

            setImagePath('');
            setErrorMessage('');
        } catch (error) {
            setApiResult((prevResults) => [
                ...prevResults,
                { imageName: imagePath, result: 'Hubo un error al obtener el resultado.', preview: imageUrl }
            ]);
        } finally {
            setLoadingPlant(false);
            setLoadingAnimal(false);
            setLoadingFootprint(false);
        }
    };

    const saveDataInDB = async () => {
        if (!latitude || !longitude) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                });
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                await sendDataToServer(position.coords.latitude, position.coords.longitude);
                setImageSaved(true);
            } catch (error) {
                console.error('Error al obtener la ubicación:', error);
                setIsMapModalOpen(true);
            }
            return;
        }

        try {
            await sendDataToServer(latitude, longitude);
            setImageSaved(true);
        } catch (error) {
            console.error('Error al guardar los datos:', error);
            setErrorMessage('Error al guardar los datos. Por favor, intenta de nuevo.');
        }
    };

    // Función separada para enviar los datos al servidor
    const sendDataToServer = async (lat, lng) => {
        try {
            console.log("Datos a enviar:", {
                base64: base64Image,
                latitude: lat,
                longitude: lng,
                imageName: apiResult[0].result,
                user: localStorage.getItem('user')
            });

            const response = await axios.post('https://ecotrack.es/nature/saveInDB', {
                base64: base64Image,
                latitude: lat,
                longitude: lng,
                imageName: apiResult[0].result,
                user: localStorage.getItem('user')
            });

            console.log("Datos guardados en la base de datos:", response);
        } catch (error) {
            console.error('Error al guardar los datos en la base de datos:', error);
            alert('Error al guardar la imagen. Por favor, intenta de nuevo.');
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                const lastChild = chatContainerRef.current.lastElementChild;
                if (lastChild) {
                    lastChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [isLoadingChat, chatResults]);

    const handleChatQuestion = async (questionText) => {
        setIsLoadingChat(true);
        try {
            // Validación básica de la pregunta
            if (!questionText.trim()) {
                alert('Por favor, escribe una pregunta');
                return;
            }

            // Añadir la pregunta al historial inmediatamente
            const newQuestion = {
                text: questionText,
                isUser: true
            };
            
            const updatedHistory = [...chatHistory, newQuestion];
            setChatHistory(updatedHistory);
            scrollToBottom();

            const response = await axios.post('https://ecotrack.es/nature/getAnswer', {
                question: questionText,
                context: currentContext,
                chat_history: updatedHistory
            });
            
            // Añadir la respuesta al historial
            const newResponse = {
                text: response.data.result,
                isUser: false
            };
            
            setChatHistory([...updatedHistory, newResponse]);
            setChatResults(prevResults => [...prevResults, {
                question: questionText,
                result: response.data.result
            }]);
            scrollToBottom();

        } catch (error) {
            console.error('Error al obtener respuesta del chat:', error);
            setChatResults(prevResults => [...prevResults, {
                question: questionText,
                result: "Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo."
            }]);
            scrollToBottom();
        } finally {
            setIsLoadingChat(false);
        }
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) {
            alert('Por favor, escribe una pregunta');
            return;
        }
        await handleChatQuestion(question);
        setQuestion(""); // Limpiar el input después de enviar
    };

    const handleCustomLocationSave = async (lat, lng) => {
        try {
            await sendDataToServer(lat, lng);
            setImageSaved(true);
            setIsMapModalOpen(false);
        } catch (error) {
            console.error('Error al guardar con ubicación personalizada:', error);
            alert('Error al guardar la imagen. Por favor, intenta de nuevo.');
        }
    };

    const formatText = (text) => {
        // Primero convertimos la negrita
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Dividimos el texto en líneas
        const lines = formattedText.split('\n').map(line => line.trim()).filter(line => line);
        
        // Procesamos cada línea
        formattedText = lines.map(line => {
            // Si la línea comienza con un número seguido de punto, es parte de una lista
            if (/^\d+\./.test(line)) {
                return `<li>${line.replace(/^\d+\.\s*/, '')}</li>`;
            }
            // Si no es una lista, es un párrafo
            return `<p>${line}</p>`;
        }).join('');

        // Agrupamos los elementos de lista consecutivos en una lista ordenada
        formattedText = formattedText.replace(/(<li>.*?<\/li>)+/g, '<ol>$&</ol>');

        return formattedText;
    };

    return (
        <div className='container'>
            <div className="izquierda">
                <h1 className="titulo-izquierda" style={{ marginTop: '20px' }}>Consultas</h1>
                <h2 className="subtitulo-izquierda">Consultar a ecotrack</h2>
                <div className="imagen-consultar">
                    {showPreview ? (
                        <div className="imagen-resultado-container">
                            <img src={showPreview} alt="Previsualización" style={{ maxWidth: '100%', maxHeight: '60%' }} />
                            {apiResult.length > 0 && (
                                <div className="resultado-inicial">
                                    <div dangerouslySetInnerHTML={{ __html: formatText(apiResult[0].result) }} style={{ textAlign: 'justify' }} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>No hay imagen para previsualizar</p>
                    )}
                </div>
                {apiResult.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="boton-consultar" onClick={() => handleApiCall("getPlant")} disabled={!base64Image || loadingPlant || loadingAnimal || loadingFootprint}>
                            {loadingPlant ? 'Consultando...' : 'CONSULTAR PLANTAS'}
                        </button>
                        <button className="boton-consultar" onClick={() => handleApiCall("getAnimal")} disabled={!base64Image || loadingAnimal || loadingPlant || loadingFootprint}>
                            {loadingAnimal ? 'Consultando...' : 'CONSULTAR ANIMALES'}
                        </button>
                        <button className="boton-consultar" onClick={() => handleApiCall("getAnimalByFootprint")} disabled={!base64Image || loadingFootprint || loadingAnimal || loadingPlant}>
                            {loadingFootprint ? 'Consultando...' : 'CONSULTAR HUELLAS'}
                        </button>
                    </div>
                ) : (
                    imageSaved ? (
                        <div className="imagen-guardada">
                            <p>✓ Imagen guardada correctamente</p>
                        </div>
                    ) : (
                        <div className="botones-guardar">
                            <button className="boton-consultar" onClick={saveDataInDB}>Guardar imagen aquí</button>
                            <button 
                                className="boton-consultar" 
                                onClick={() => setIsMapModalOpen(true)}
                            >
                                Guardar imagen en otra ubicación
                            </button>
                        </div>
                    )
                )}
            </div>
            <div className="derecha">
                <div className="respuesta">
                    <h3>Chat</h3>
                    <div className="contenedor-completo" ref={chatContainerRef}>
                        <div className="seccion-resultado">
                            <div className="chat-container">
                                {chatResults.slice().map((chat, index) => (
                                    <div key={`chat-${index}`} className="chat-message">
                                        <div className="user-message">
                                            <div className="message-bubble user-bubble">
                                                <p>{chat.question}</p>
                                            </div>
                                        </div>
                                        <div className="bot-message">
                                            <div className="message-bubble bot-bubble">
                                                <div dangerouslySetInnerHTML={{ __html: formatText(chat.result) }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoadingChat && (
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                        <p>Procesando tu pregunta...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {apiResult.length > 0 && (
                    <div className="seccion-pregunta">
                        <form onSubmit={handleQuestionSubmit} className="question-form">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="question-input"
                                placeholder={placeholder}
                                disabled={isLoadingChat}
                                onFocus={() => setPlaceholder("")}
                                onBlur={() => {
                                    if (!question) {
                                        setPlaceholder("Pregunta algo sobre la imagen analizada...");
                                    }
                                }}
                            />
                            <button type="submit" className="submit-button" disabled={isLoadingChat}>
                                {isLoadingChat ? (
                                    <span>...</span>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 12l7-7v4h13v6H9v4l-7-7z" fill="currentColor" transform="rotate(180 12 12)" />
                                    </svg>
                                )}
                            </button>
                        </form>
                        <p className="chat-hint">
                            Puedes preguntarme cualquier cosa sobre {currentContext.split(":")[0]}
                        </p>
                    </div>
                )}
            </div>

            <MapModal 
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                onLocationSelect={handleCustomLocationSave}
            />
        </div>
    );
}

export default Finder;