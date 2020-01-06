# www.tforster.com

The official website of Troy Forster

## Installation

These are the latest notes, in progress, for 4.x setting up and running this project. Note that it functions as the test-bed for the upcoming Joy WebProducer project and as such, Joy WebProducer is nested in /src/WebProducer. Once the WebProducer code has undergone more testing and is stable it will be moved to it's own repository. At that time WebProducer will become an NPM dependency of this project.

1. Create a free account with [DatoCMS](https://www.datocms.com/pricing).
   1. Create content types and populate them. See the [DatoCMS documentation](https://www.datocms.com/docs).
1. Create an AWS IAM user with full administrative access (future release will indicate minimal required permissions)
1. Create an AWS [Amplify Console application](https://console.aws.amazon.com/amplify/home?region=us-east-1#/) in us-east-1 and note it's appId. Note that we use us-east-1 as Amplify is not available in all regions yet (including ca-central-1)
1. Create an S3 bucket that will contain the zip'd deployment file for Amplify. Currently the permissions need to be open with public access. A future release will include hardening details.
1. Clone the repo as usual
1. cd to project root an install linting dependencies with `npm i`
1. cd to src directory and install Lambda dev dependencies with `npm i`
1. Update and/or create /src/.env with variables for
   - DATOCMS_TOKEN
   - AMPLIFY_APP_ID
1. Make any additional changes to src/handler.js
1. Create a GraphQL query against your CMS that fetches all the data. Place it in src/db/query.graphql
1. Create an optional transformation function in handler.js that would execute against the returned data to further shape it into what is needed.
1. Edit the handlebars templates in /src/theme/templates as well as the organisms in /src/theme/organisms
1. cd to the /src directory and start the local API gateway environment by running `npm run-script debug` to start the serverless-offline plugin.
1. cURL the local Lambda endpoint with something like `curl -X POST http://localhost:3000/{apiVersion}/functions/webProducer-dev-build/invocations` and in about 2 seconds the project should be built and deployed to AWS Amplify.

### Debugging with Visual Studio Code

1. Add the following snippet to .vscode/launch.json:

    ```json
    {
      "type": "node",
      "request": "attach",
      "name": "Attach",
      "cwd": "${fileDirname}",
      "port": 9229,
      "skipFiles": [
        "<node_internals>/**"
      ]
    },
    ```

1. Change directory to the serverless service `cd src/`.
1. Start the serverless offline plugin to create a local API Gateway and Lambda envrionment `npm run debug`.
1. Set any required breakpoints in VSCode
1. Press F5 to start the interactive debugger (Choose the new profile if you have more than one defined)
1. Issue an HTTP request with cURL, PostMan, etc. `curl -X POST http://localhost:3000/{apiVersion}/functions/webProducer-dev-build/invocations`
1. Step through after the breakpoint is hit

### Required Dependencies

An LTS version of NodeJS 12. Note that as of this writing the latest AWS Lambda JavaScript runtime supported is 12.x. See the [runtime](https://docs.aws.amazon.com/lambda/latest/dg//lambda-runtimes.html) page for current details.
NPM
AWS SDK

## Built With

The following is a list of the technologies used to develop and manage this project.

| Tool                                                                                                              | Description                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [AWS-SDK](https://aws.amazon.com/sdk-for-node-js/)                                                                | Helps orchestrate S3 and Cloudfront management                                                       |
| [Coffee](https://en.wikipedia.org/wiki/Coffee)                                                                    | A good source of [C8H10N4O2](https://pubchem.ncbi.nlm.nih.gov/compound/caffeine)                     |
| [DatoCMS](https://www.datocms.com)                                                                                | A GraphQL native CaaS                                                                                |
| [Git 2.17.1](https://git-scm.com/)                                                                                | Source Code Management (SCM) client                                                                  |
| [Joy](https://github.com/tforster/joy)                                                                            | A semi-opinionated framework for managing some common devops tasks                                   |
| [NodeJS 12.3.0](https://nodejs.org/en/)                                                                           | Task running, automation and driving the API                                                         |
| [NPM 6.10.1](https://www.npmjs.com/package/npm)                                                                   | Node package management                                                                              |
| [Oh-My-Zsh](https://github.com/robbyrussell/oh-my-zsh)                                                            | ZSH shell enhancement                                                                                |
| [Serverless Framework](https://serverless.com)                                                                    |                                                                                                      |
| [Ubuntu 18.04 for WSL2](https://www.microsoft.com/en-ca/p/ubuntu/9nblggh4msv6?activetab=pivot:overviewtab)        | Canonical supported Ubuntu for Windows Subsystem for Linux                                           |
| [Visual Studio Code 1.41.1](https://code.visualstudio.com/)                                                       | Powerful and cross-platform code editor                                                              |
| [Windows 10 Pro Insider Preview](https://www.microsoft.com/en-us/software-download/windowsinsiderpreviewadvanced) | The stable version of the Insiders build typically brings new tools of significant use to developers |
| [WSL 2](https://docs.microsoft.com/en-us/windows/wsl/install-win10)                                               | Windows Subsystem for Linux supports native Linux distributions                                      |
| [ZSH](https://www.zsh.org/)                                                                                       | A better shell than Bash                                                                             |

## Special Thanks

Wes Bos for contributing the Docker [SVG icon](https://github.com/wesbos/Font-Awesome-Docker-Icon)

## Change Log

v4.0.0 **Migrated to Serverless Build Architecture with AWS Amplify Hosting** (2019-12-07)

Migrated this site to AWS Amplify whilst converting from a SPA back to a static no-js website. As part of the definition of the Joy framework we now differentiate between a website and a web app where a website should run without JavaScript and use the browsers builtin router (e.g. hyperlinks, history, back button, etc). The AWS Amplify services were not available during the last significant architectural refactoring but are used here for rapid bootstrapping, development and deployment of websites such as this. The build system has been converted from EJS to handlebars and is hosted as an AWS Lambda function.

v3.1.0 **Feature iteration and bug fixes** (2017-06-20)

- .gitignore: Now includes yarn error logs
- gulpfile.js: Switched from UglifyJS to [Babili](https://github.com/babel/babili) for ES6 minification. Also added TinyPNG support for crushing .png and .jpg images
- package.json: NPM script `s3-server` launches both s3-server and gulp watch (and should be renamed more appropriately in next release)
- app.js:
  - Started migration to native ES6 following decision to not support IE
  - Moved render functions outside of main class. More refactoring to come to gain complete separation of router logic from site specific implementation.
  - Improved error handling when loading physical .html template files
  - Removed deprecated event listener on scroll
  - Added renderPortfolioItem
  - Added normalizeLinkedItems to better handle Contentful responses. Later release might see a standalone Contentful client
- *.html: numerous tweaks and cosmetic improvments

v3.0.0 **Replatformed using a serverless architecture** (2017-05-07)

- Migrated from NodeJS/ExpressJS hosted on Digital Ocean to Serverless architecture on AWS S3 with AWS Lambda support
- Added a completely overhauled gulpfile automating the build process
- Migrated from NPM to Yarn
- Switched from Git Bash on Windows to ZSH on Linux (on Windows)
- Switched from Visual Studio Community Edition to Visual Studio Code
- Redesigned from a SPA-like experience to a more UX friendly multi-page experience
- Eschewed the paid and overly bloaty theme-forest theme to a W3Schools CSS-only theme
- Utilizing Content as a Service (CaaS) via Contentful
- No more Modernizr
- No more jQuery
- No more HTML5Shiv
- No Angular, React, Ember, etc
- ES5 __not__ ES6 because:
  - Not all evergreen browers are supporting the full ES6 feature set natively (but soon)
  - Babel transpiles ES6 to ES5 so evergreen browsers supporing ES6 still end up running ES5
  - By not relying on frameworks as a default behaviour the entire JS footprint is under 5kb including a custom router, view manager, cms, etc.
  - P.s. I speak fluent ES6 when targeting NodeJS and AWS Lambda

v2.0.0 **Now a NodeJS/Express App**

- Migrated from ASP.NET on GoDaddy to NodeJS/ExpressJS on Digital Ocean

v1.0.0

- ASP.NET
