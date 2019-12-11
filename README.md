# www.tforster.com

The official website of Troy Forster

[![StackShare](https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](https://stackshare.io/tforster/www-tforster-com)

## Installation

These are the latest notes, in progress, for 4.x using Dockerfied Strapi etc.

1. Clone as usual
2. Create dist folder `mkdir -p dist/portfolio`. Will be automated soon.
3. Install dependencies `npm i`
4. Install and start Strapi `docker-compose -f docker/docker-compose.yml
5. Restore latest data from db/strapi
   1. Find the Mongo container id with `docker ps`
   2. Shell into the container `docker exec -it {container id} /bin/sh`
   3. Confirm the dump directory was mapped from db/strapi via docker-compose with `ls dump`
   4. Restore from containers dump directory with /usr/bin/mongorestore --db strapi /dump`
   5. Exit the container
6. Navigate to `http://localhost:1337/admin`
7. Login with credentials provided outside of this README to see the GUI
8. Use the PostMan file, in test, to log into the GraphQL API and fetch pages
   1. Create username and password keys in the PostMan environment file corresponding to the same credentials as required for the GUI

The build process can be executed with `node buildfile.js` which should populate dist with a handful of file. Note that build is still using Contentful as a data source but that will be switched to Strapi shortly.

### Required Dependencies

Node 13+
NPM
Docker
Docker Compose
AWS SDK

## Usage

## Built With

The following is a list of the technologies used to develop and manage this project.

| Tool                                                                                                              | Description                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [AWS-SDK](https://aws.amazon.com/sdk-for-node-js/)                                                                | Helps orchestrate S3 and Cloudfront management                                                       |
| [Cloudinary](http://cloudinary.com)                                                                               | Use as a CLI (via query string) to crop and resize images                                            |
| [Coffee](https://en.wikipedia.org/wiki/Coffee)                                                                    | A good source of [C8H10N4O2](https://pubchem.ncbi.nlm.nih.gov/compound/caffeine)                     |
| [Contentful](http://contentful.com)                                                                               | Content as a Service (CaaS) accessible via a GraphQL api                                             |
| [Git 2.17.1](https://git-scm.com/)                                                                                | Source Code Management (SCM) client                                                                  |
| [Gulp](http://gulpjs.com/)                                                                                        |                                                                                                      |
| [Joy](https://github.com/tforster/joy)                                                                            | A semi-opinionated framework for managing some common devops tasks                                   |
| [NodeJS 12.3.0](https://nodejs.org/en/)                                                                           | Task running, automation and driving the API                                                         |
| [NPM 6.10.1](https://www.npmjs.com/package/npm)                                                                   | Node package management                                                                              |
| [Oh-My-Zsh](https://github.com/robbyrussell/oh-my-zsh)                                                            | ZSH shell enhancement                                                                                |
| [PlantUML](http://plantuml.com/)                                                                                  | A text syntax for creating numerous technical and business diagram types                             |
| [Serverless Framework](https://serverless.com)                                                                    |                                                                                                      |
| [Ubuntu 18.04 for WSL](https://www.microsoft.com/en-ca/p/ubuntu/9nblggh4msv6?activetab=pivot:overviewtab)         | Canonical supported Ubuntu for Windows Subsystem for Linux                                           |
| [Visual Studio Code 1.36.1](https://code.visualstudio.com/)                                                       | Powerful and cross-platform code editor                                                              |
| [Windows 10 Pro Insider Preview](https://www.microsoft.com/en-us/software-download/windowsinsiderpreviewadvanced) | The stable version of the Insiders build typically brings new tools of significant use to developers |
| [WSL 2](https://docs.microsoft.com/en-us/windows/wsl/install-win10)                                               | Windows Subsystem for Linux supports native Linux distributions                                      |
| [ZSH](https://www.zsh.org/)                                                                                       | A better shell than Bash                                                                             |

* [Cloudinary](http://cloudinary.com): Use as a CLI (via query string) to crop and resize images
* [babel-eslint](https://github.com/babel/babel-eslint): Handles ES2017 features like arrow functions inside classes better than the default Espree parser.
* [TinyPNG](https://tinypng.com/developers): PNG and JPG minification
* [Babili](https://github.com/babel/babili): ES6 minification

## Special Thanks

Wes Bos for contributing the Docker SVG icon https://github.com/wesbos/Font-Awesome-Docker-Icon

## Change Log

v4.0.0 **Migrated to AWS Amplify** (2019-12-07)

Migrated this site to AWS Amplify whilst converting from a SPA back to a static no-js website. As part of the definition of the Joy framework we now differentiate between a website and a web app where a website should run without JavaScript and use the browsers builtin router (e.g. hyperlinks, history, back button, etc). The AWS Amplify services were not available during the last significant architectural refactoring but are used here for rapid bootstrapping, development and delpoyment of websites such as this. The build system has been converted from EJS to handlebars.

v3.1.0 **Feature iteration and bug fixes** (2017-06-20)

* .gitignore: Now includes yarn error logs
* gulpfile.js: Switched from UglifyJS to [Babili](https://github.com/babel/babili) for ES6 minification. Also added TinyPNG support for crushing .png and .jpg images
* package.json: NPM script `s3-server` launches both s3-server and gulp watch (and should be renamed more appropriately in next release)
* app.js:
  * Started migration to native ES6 following decision to not support IE
  * Moved render functions outside of main class. More refactoring to come to gain complete separation of router logic from site specific implementation.
  * Improved error handling when loading physical .html template files
  * Removed deprecated event listener on scroll
  * Added renderPortfolioItem
  * Added normalizeLinkedItems to better handle Contentful responses. Later release might see a standalone Contentful client
* *.html: numerous tweaks and cosmetic improvments

v3.0.0 **Replatformed using a serverless architecture** (2017-05-07)

* Migrated from NodeJS/ExpressJS hosted on Digital Ocean to Serverless architecture on AWS S3 with AWS Lambda support
* Added a completely overhauled gulpfile automating the build process
* Migrated from NPM to Yarn
* Switched from Git Bash on Windows to ZSH on Linux (on Windows)
* Switched from Visual Studio Community Edition to Visual Studio Code
* Redesigned from a SPA-like experience to a more UX friendly multi-page experience
* Eschewed the paid and overly bloaty theme-forest theme to a W3Schools CSS-only theme
* Utilizing Content as a Service (CaaS) via Contentful
* No more Modernizr
* No more jQuery
* No more HTML5Shiv
* No Angular, React, Ember, etc
* ES5 __not__ ES6 because:
  * Not all evergreen browers are supporting the full ES6 feature set natively (but soon)
  * Babel transpiles ES6 to ES5 so evergreen browsers supporing ES6 still end up running ES5
  * By not relying on frameworks as a default behaviour the entire JS footprint is under 5kb including a custom router, view manager, cms, etc.
  * P.s. I speak fluent ES6 when targeting NodeJS and AWS Lambda 

v2.0.0 **Now a NodeJS/Express App**

* Migrated from ASP.NET on GoDaddy to NodeJS/ExpressJS on Digital Ocean

v1.0.0

* ASP.NET
