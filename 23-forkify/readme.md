<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://forkify-recipe-search.onrender.com">
    <img src="./src/img/logo.png" alt="Logo" width="100%" height="100%">
  </a>

  <h3 align="center">Forkify</h3>

  <p align="center">
    A recipe search application made with javascript.
    <br />
    <a href="#about-the-project"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://forkify-recipe-search.onrender.com">View Demo</a>
    ·
    <a href="https://github.com/ajfm88/javascript-30-projects/issues">Report Bug</a>
    ·
    <a href="https://github.com/ajfm88/javascript-30-projects/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>fb

  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

[![Forkify](https://github.com/ajfm88/javascript-30-projects/blob/main/23-forkify/src/img/screenshot.jpg)](https://forkify-recipe-search.onrender.com)
Forkify is a vanilla JavaScript application that interacts with the Forkify API to fetch and display recipe food data. This app uses modern JavaScript tools, such as Webpack to bundle the modules, and Babel to convert ES6, ES7 and ES8 back to ES5. The user can search for a specific recipe, and save to a favorites list via local storage. The user can easily increase or decrease servings as per his need and can view detailed directions.

### Built With

This app was built with pure vanilla JavaScript along with HTML5 and SCSS. It uses webpack as module bundler and NPM as package manager.

- [HTML5](https://html.spec.whatwg.org)
- [SCSS](https://sass-lang.com)
- [JavaScript](https://www.ecma-international.org/publications-and-standards/standards/ecma-262)
- [Webpack](https://webpack.js.org)
- [NPM](https://www.npmjs.com)

<!-- GETTING STARTED -->

## Getting Started

To get started with project just simply fork this repo or download locally on your System.

To get a local copy up and running follow these simple example steps.

### Prerequisites

Start with the latest version of NPM to avoid any errors:

- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Get a free API Key at [Forkify API_KEY](https://forkify-api.herokuapp.com/v2)
2. Clone the repo
   ```sh
   git clone https://github.com/ajfm88/javascript-30-projects.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Enter your API in `config.js`
   ```JS
   const KEY = 'ENTER YOUR API';
   ```

<!-- USAGE EXAMPLES -->

## Usage

1. The Forkify Recipe App allows users to search for recipes.

2. Users can view the recipe along with the cook time and also
   increase or decrease the amount of servings they need.

3. Bookmarked recipes are stored in local storage so no database was
   required for this application.

_For more examples, please refer to the [Documentation](https://forkify-api.herokuapp.com/v2)_

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/ajfm88/javascript-30-projects/issues) for a list of proposed features (and known issues).

### Proposed features

1. Number of pages between the pagination buttons.

2. Ability to sort search results by duration or number of ingredients.

3. Ingredient validation in view, before submitting the form.

4. Improving recipe ingredient input: separate in multiple fields and allow more
   than 6 ingredients.

5. Shopping list feature: button on recipe to add ingredients to a list.

6. Weekly meal planning feature: assign recipes to the next 7 days and show
   on a weekly calendar.

7. Nutrition data on each ingredient from spoonacular API (https://
   spoonacular.com/food-api) and calculate total calories of recipe.
