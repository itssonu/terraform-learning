FROM public.ecr.aws/lambda/nodejs:18
COPY package*.json ./
RUN yum install -y \
    graphicsmagick \
    ghostscript
RUN ln -s /usr/bin/cmake3 /usr/bin/cmake
RUN ls
RUN npm i
COPY . .
ARG DOCUMENTDBURL
ENV DATABASE_URL=${DOCUMENTDBURL}
EXPOSE 9005
#ENTRYPOINT [ "/usr/local/bin/npx", "aws-lambda-ric" ]
CMD [ "App.handler" ]