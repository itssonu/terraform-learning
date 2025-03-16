FROM ubuntu:20.04

WORKDIR /opt/backend

RUN su -
RUN  apt-get update
RUN apt-get install sudo -y
RUN sudo apt install curl -y
RUN curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
RUN sudo bash nodesource_setup.sh
RUN sudo apt install nodejs -y 
RUN sudo apt-get install graphicsmagick -y
RUN sudo apt-get install ghostscript libgs-dev -y
RUN sudo apt-get install -y fontconfig
RUN sudo apt-get install -y libfontconfig
RUN echo "resolvconf resolvconf/linkify-resolvconf boolean false" | debconf-set-selections


COPY . .
# Rference [https://github.com/Medium/phantomjs#linux-note][1]
RUN sudo npm set strict-ssl false
RUN sudo npm install 
RUN sudo npm install -g phantomjs-prebuilt 
RUN sudo npm install -g html-pdf 

RUN sudo npm link html-pdf
RUN sudo npm link phantomjs-prebuilt

RUN sudo npm rebuild

COPY package*.json ./
RUN ln -s /usr/bin/cmake3 /usr/bin/cmake
RUN ls

RUN npm i
COPY . .
ARG DOCUMENTDBURL
ENV DATABASE_URL=${DOCUMENTDBURL}
ENV OPENSSL_CONF=/dev/null
EXPOSE 3000
EXPOSE 5000
EXPOSE 10000
#ENTRYPOINT [ "/usr/local/bin/npx", "aws-lambda-ric" ]
CMD [ "node", "server.js" ]