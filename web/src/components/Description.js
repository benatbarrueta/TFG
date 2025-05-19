import React from "react";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "../styles/Description.css";
import animal from "../styles/images/animal.png";
import huella from "../styles/images/huella.png";
import arbol from "../styles/images/arbol.png";
import chat from "../styles/images/chat.png";
import mapa from "../styles/images/mapa.png";
import baseDatos from "../styles/images/baseDatos.png";
import interfaz from "../styles/images/interfaz.png";

const Description = () => {
    const loginWithGoogle = async () => {
        try {
            console.log('Iniciando sesión con Google...');
            const response = await axios.get('http://localhost:8001/auth/google');
            if (response.status === 200 && response.data.authorization_url) {
                console.log('Redirigiendo a:', response.data.authorization_url);
                window.location.href = response.data.authorization_url;
                console.log('Redirección exitosa.');
            }
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error);
        }
    };

    return (
        <div className="description-wrapper">
            <div className="inicio-titulo">
                <div className="inicio-imagen-fondo">
                    <h1>ECOTRACK</h1>
                    <p>Tu herramienta esencial para descubrir la vida silvestre.<br></br> <br></br> Identifica huellas, animales y plantas al instante.</p>
                </div>
            </div>

            <div className="inicio-container">
                <section className="inicio-seccion">
                    <h2>¿Quienes somos?</h2>
                    <div className="inicio-contenido">
                        <p>
                            Somos un equipo apasionado por la naturaleza, la tecnología y el conocimiento. Nuestra misión es conectar a las personas con el mundo natural a través de herramientas innovadoras que facilitan el descubrimiento y la comprensión de la biodiversidad.
                            <br />
                            <br />
                            Creemos en el poder de la tecnología para impulsar la exploración científica y el aprendizaje, ofreciendo soluciones que combinan precisión, simplicidad y una experiencia enriquecedora. Trabajamos para acercar la ciencia y la naturaleza a investigadores, estudiantes y curiosos, ayudándolos a descubrir la riqueza que nos rodea y a contribuir a su conservación.
                            <br />
                            <br />
                            Con un enfoque en la innovación y el impacto, buscamos inspirar a las personas a conocer, apreciar y proteger nuestro entorno natural.
                        </p>
                    </div>
                </section>

                <section className="inicio-seccion">
                    <h2>¿Qué hacemos?</h2>
                    <div className="inicio-contenido">
                        <p>Proporcionamos una herramienta intuitiva que permite a los usuarios subir imágenes de huellas y plantas para obtener información detallada sobre su especie, características y hábitat. Esta herramienta ha sido diseñada pensando en la simplicidad y eficacia, brindando una experiencia de usuario agradable y funcional.
                            <br />
                            <br />
                            Los usuarios pueden explorar una amplia gama de datos, incluyendo nombres científicos, distribución geográfica, y otros detalles relevantes. Esto es útil tanto para investigadores que buscan identificar nuevas especies o analizar patrones, como para aficionados a la botánica y la biología que desean aprender más sobre el mundo natural que los rodea.</p>
                    </div>
                </section>

                <section className="inicio-seccion">
                    <h2>Funcionalidades</h2>
                    <div className="imagenes">
                        <div className="imagen-texto">
                            <img src={animal} alt="animal" />
                            <p className="textoImagen">Reconocimiento <br></br>animales</p>
                        </div>
                        <div className="imagen-texto">
                            <img src={huella} alt="huella" />
                            <p className="textoImagen">Reconocimiento <br></br>huellas</p>
                        </div>
                        <div className="imagen-texto">
                            <img src={arbol} alt="arbol" />
                            <p className="textoImagen">Reconocimiento <br></br>plantas</p>
                        </div>
                        <div className="imagen-texto">
                            <img src={chat} alt="chat" />
                            <p className="textoImagen">Chat para<br></br>posibles consultas</p>
                        </div>
                        <div className="imagen-texto">
                            <img src={mapa} alt="mapa" />
                            <p className="textoImagen">Mapa para <br></br>mostrar localizaciónes</p>
                        </div>
                        <div className="imagen-texto">
                            <img src={baseDatos} alt="baseDatos" />
                            <p className="textoImagen">Base de datos <br></br>extensa</p>
                        </div>
                        <div className="imagen-texto">
                            <img src={interfaz} alt="interfaz" />
                            <p className="textoImagen">Interfaz <br></br>amigable</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Description;