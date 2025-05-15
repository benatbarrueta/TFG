# Pasos para instalar lo necesario en el servidor

## 1. Cambiar contraseña
Es necesario cambair la contraseña que el distribuidor del servidor nos ofrece, ya que tendríamos que aprendernos la que nos dan en lugar de poner yna que sea más simple para nosotros. Para cambiar a **root**, por ejemplo, debemos ejecutar el siguiente comando.

```bash
sudo passwd root
```

## 2. Instalar docker
Para la correcta ejecución de los proyectos Docker es la herramienta correcta. Esto se debe a que nos permite ejecutar varios microservicos a la vez ejecutando un simple comando. Para instalarlo deberemos seguir  los pasos que se indican a continuación:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Añade el repositorio a los servicios de APT:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo docker run hello-world
```

## 3. Incluir carpeta contentedora de nginx

Para que podamos tener nuestro proyecto ejecutado necesitamos tener un

```
docker compose build nginx --no-cache
sudo docker compose up -d nginx
```

## 4. Añadir carpeta principal del proyecto

Para poder ejecutar nuestro proyecto es necesario incorporar el repositoro a la carpeta del servidor. Para ello tenemos varias formas.

### 1. Importar el repositorio de github
Para poder utilizar esta técnica el proyecto debe estar alojado en la plataforma github.

Lo primero que necesitas es crear una clave ssh, esto sirve para que la plataforma reconozca tu servidor de una forma segura. Para ello seguimos los siguientes pasos:

El primer paso es ejecutar este comando en tu terminal sustituyendo ```your_email@example.com``` por el correo asociado a tu cuenta.
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```
Cuando ejecutemos el comando este nos pedirá una contraseña (mi recomendación es no poner nada, dar al enter con el vacio)

Una vez hemos añadido o no la contraseña deberemos añadir la clave ssh al agente ssh para ello realizamos lo siguiente.

Iniciamos el agente en segundo plano:
```bash
eval "$(ssh-agent -s)"
```

Una vez hemos ejecutado el comando nos deverá aparecer una mensaje parecido al siguiente, siendo el numero del pid distinto al que se muestra aquí:

```bash
Agent pid 59566
```

Una vez está el agente ejecutado hay que añadir nuestra clave privada al agente.Para ello ejecutamos la siguiente acción:
```bash
ssh-add ~/.ssh/id_ed25519
```
Una vez hecho esto deberemos dirigirnos a la plataforma github para añadir nuestra clave pública. Para realizar esto lo primero que tenemos que ahcer es copiar nuestra clave ssh pública. Para ello ejecutamos los siguientes comandos:

```bash
cat ~/.ssh/id_ed25519.pub
```

Esto nos mostrará la clave en la terminal, por tanto, debemos copiar la clave que nos muestra.

Una vez tenemos esto copiado debemos dirigirnos a la plataforma github para seguir los siguientes pasos.

1. En la parte superior derecha pulsamos en nuestra imagen seguido de Settings.

2. Una vez estamos en los ajustes se deberá acceder al apartado ```SSH and GPG keys ```

3. Una vez hemos accedido aquí deberemos pulsar sobre el botón ```new SSH key```

4. Ponemos un título y en el campo key pegamos la clave pública que hemos copiado anteriormente.

5. Con esto hemos conseguido crear la clave ssh


Una vez tenemos esto deberemos descargar nuestro repositorio. Para ello bastará con ejecutar el siguiente comando en el cual deberemos sustituir los campos usuario por tu nombre de usuario y nombreRepo por el nombre del repositorio:

```bash
git clone git@github.com:usuario/nombreRepo.git
```

Este enlace se puede obtener de la siguiente forma:

1. En la plataforma github acceder al repositorio que deseamos clonar

2. Pulsar sobre el botón ```<> Code```de color verde.

3. Cambiar a la opción ssh y nos muestra el enlace

### 2. Copiar la carpeta local al servidor

Es verdad que esta es la opción más rápida para poder ejecutar el proyecto, pero no nos permite poder subir cambios a nuestro repositorio remoto.

Bastará con copiar la carpeta que tenemos en local y pegarla en el servidor, o arrastrando la carpeta con el código fuente a la carpeta del servidor.



Una vez tenemos todo esto hechoi y los dockerfiles y el docker compose creados correctamente bastará ejecutar los siguientes comandos.

Lo primero es saber que el proyecto está dividido en dos carpetas, por un lado nginx y por el otro el proyecto.

Pasos para lanzar el proyecto.

Suponemos que las carpetas se llaman nginx-docker y proyecto.

1. Acceder a la carpeta nginx

2. Construir nginx:

```bash
docker compose --build nginx-docker
```

3. Ejecutar nginx:

```bash
docker compose up nginx-docker -d
```

4. Salir de la carpeta de nginx y acceder a la de proyecto

5. Construir el proyecto:

```bash
docker compose --build proyecto
```

6. Ejecutar el proyecto:
```bash
docker compose up proyecto -d
```

7. Para parar cualquiera de los contenedores accedemos a la carpeta que queramos y ejecutamos el siguiente comando:

```bash
docker compose down
```