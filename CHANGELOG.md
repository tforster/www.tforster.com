# Change Log  <!-- omit in toc -->

_A detailed history of project versions and associated release notes._

- This project uses **Semantic Versioning 2.0.0**. Please see [SemVer](https://semver.org/) to read the specification.

## Table of Contents <!-- omit in toc -->

- [v11.0.0 **Cloudflare**](#v1100-cloudflare)
- [v10.1.0 **Feature iteration and bug fixes** (2017-06-20)](#v1010-feature-iteration-and-bug-fixes-2017-06-20)
- [v10.0.0 **Serverless Architecture** (2017-05-07)](#v1000-serverless-architecture-2017-05-07)
- [v9.0.0 **Return to Express**](#v900-return-to-express)
- [v8.0.0 **Ghost CMS**](#v800-ghost-cms)
- [v7.0.0 **Service Oriented Architecture (SOA)**](#v700-service-oriented-architecture-soa)
- [v6.0.0 **GitHub Pages**](#v600-github-pages)
- [v5.0.0 **DotNetNuke CMS**](#v500-dotnetnuke-cms)
- [v4.0.0 **ASP.Classic**](#v400-aspclassic)
- [v3.0.0 **wordpress.org**](#v300-wordpressorg)
- [v2.0.0 **ASP.classic on another long forgotten host**](#v200-aspclassic-on-another-long-forgotten-host)
- [v1.0.0 **HTML on a long forgotten host**](#v100-html-on-a-long-forgotten-host)

## v11.0.0 **Cloudflare**

## v10.1.0 **Feature iteration and bug fixes** (2017-06-20)

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

## v10.0.0 **Serverless Architecture** (2017-05-07)

- Serverless architecture on AWS S3 with AWS Lambda support
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
- ES5 **not** ES6 because:
  - Not all evergreen browsers are supporting the full ES6 feature set natively (but soon)
  - Babel transpiles ES6 to ES5 so evergreen browsers supporting ES6 still end up running ES5
  - By not relying on frameworks as a default behaviour the entire JS footprint is under 5kb including a custom router, view manager, cms, etc.
  - P.s. I speak fluent ES6 when targeting NodeJS and AWS Lambda

## v9.0.0 **Return to Express**

- Moved from Ghost back to NodeJS/ExpressJS since Ghost has massively overblow dependencies and feels more like Wordpress from a developer perspective
- Replaced Jade with EJS
- Bumped ExpressJS to 4

## v8.0.0 **Ghost CMS**

- Experimenting with Ghost as I backed it when it was a Kickstarter project
  
## v7.0.0 **Service Oriented Architecture (SOA)**

- Hosted on Digital Ocean
- Express routes used to serve a RESTful API
- Express static used to serve static HTML content
- Bootstrap
- Mongoose
- Angular

## v6.0.0 **GitHub Pages**

- Hosted on GitHub Pages

## v5.0.0 **DotNetNuke CMS**

- Hosted on GoDaddy

## v4.0.0 **ASP.Classic**

- Hosted on GoDaddy
  
## v3.0.0 **wordpress.org**

## v2.0.0 **ASP.classic on another long forgotten host**

## v1.0.0 **HTML on a long forgotten host**
