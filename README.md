# www.tforster.com

_The official website of Troy Forster_

# Built With

* [Visual Studio Code](https://code.visualstudio.com/) on Windows 10
* [Oh-My-Zsh](https://github.com/robbyrussell/oh-my-zsh) on Bash on Ubuntu on [Windows Subsystem for Linux](https://msdn.microsoft.com/en-us/commandline/wsl/install_guide)
* [NodeJS](https://nodejs.org/en/) 7.8.0
* ~~NPM 4.2.0~~ [Yarn](https://yarnpkg.com/lang/en/) 0.2.34
* [Git](https://git-scm.com/) 2.7.4
* [Contentful](http://contentful.com)
* [Gulp](http://gulpjs.com/)
* [Node static server](https://github.com/nbluis/static-server)
* [Coffee](https://en.wikipedia.org/wiki/Coffee)

# Developer Setup

1. Ensure all dependencies are installed (see Built With above)
1. Run `yarn`
1. Run `static-server build/dev & gulp watch` to automatically build and serve development changes from build/dev
1. Start editing...
1. Run `gulp build --target stage` to build a stage release. Test the release locally with `static-server build/stage`
1. Deploy to S3 with `gulp deploy --target {stage | prod}`

# Change Log

## v3.0.0 (2017-05-07)

* Migrated from NodeJS/ExpressJS hosted on Digital Ocean to Serverless architecture on AWS S3 with AWS Lambda support
* Added a completely overhauled gulpfile automating the build process
* Migrated from NPM to Yarn
* Switched from Git Bash on Windows to ZSH on Linux (on Windows)
* Switched from Visual Studio Community Edition to Visual Studio Code
* Redesigned from a SPA-like experience to a more UX friendly multi-page experience
* Eschewed the paid and overly bloaty theme-forest theme to a W3Schools CSS-only theme
* No more Modernizr
* No more jQuery
* No more HTML5Shiv

## v2.0.0 ()

* Migrated from ASP.NET on GoDaddy to NodeJS/ExpressJS on Digital Ocean
