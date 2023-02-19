# CONTRIBUTING
Thank you for considering contributing to this project! Below are is some guidance for how to contribute to this project.

# Issues and Bugs
Experiencing any bugs or issues with this project? Follow these steps to get them resolved: 
1. Search for the issue you are facing to see if it exists
2. If it doesn't exist, create one with a descriptive name, and fill in the details of the issue you are facing
3. Kindly provide enough information for maintainers to reproduce the bug you are facing: e.g what version of the library you are on, the version of Next.js you are on, and more.

# Development
Before you introduce new code to the project, kindly open an issue describing the problem you hope to solve or feature you wish to add if one doesnt exist already. 
This will help maintainers and the community to review and accept the proposed feature.

Next, follow these steps to get setup:
1. Fork this repository
2. Clone the repository to your computer: `git clone https://github.com/{your-username}/nextjs-handler-middleware.git`
3. Run `yarn` to install all project dependencies
4. Create a branch for the changes you would like to make, giving it a meaningful name (e.g `add-response-types`, `fix-response-types`, etc.)

### Pull Requests
1. Once changes are ready, open a pull request from your branch into this projects `main` branch. Give your PR a name describing your overall contribution.
2. In your PR description include things such as (motivation, changes being made, instructions for testing, a demo if possible etc.). Also link related issues.
3. Ensure that your PR meets the necessary testing requirements below!

### Testing
This project uses [ava](https://github.com/avajs/ava) for testing. Before your PR can be merged, make sure you have done the following:
1. Added tests for the changes/fixes being introduced by your PR
2. Ensure that all tests are passing by running `yarn test`
3. Ensure that the project still builds with `yarn build`

### Documenttation
If your PR introduces any breaking changes or changes in API's kindly modify the documentation to reflect this on your PR's branch. 
All documentation for the library currently lives in the project's `README.md`.

## What changes can I make?
All kinds of changes are welcome to this project, ranging from:
1. Fixing typos in documentation
2. Adding new features
3. Fixing bus
4. Adding/improving tests
5. Performance optimizations
6. Type improvements
7. and more!

