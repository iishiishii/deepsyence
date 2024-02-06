# Welcome to Deepsyence 👋
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000)

Deep learning in the browser for medical images.

These models are finetuned with interactive points and bounding boxes. The models are then quantized to small sizes for inference in the browser.

This app aims to reduce the constraints that hold back the deployment of deep learning models for medical images.

## Features
### Convert model checkpoint to onnx format for inference in the browser
- Upload checkpoint file and config file with preprocessing steps
- Convert to onnx format
- Download onnx model
### Model deployment
- Upload onnx model
- Upload test image
- Run inference interactively within image
### Annotation tool
- Get automated annotations from model
- Interactively correct annotations
- Download annotations


### ✨ [Demo](https://iishiishii.github.io/deepsyence/)

## Development setup
Install dependencies
```sh
yarn install
```

then start the application

```sh
yarn start
```

Run tests

```sh
yarn run test
```

## Author

👤 **Thuy Dao**

* Github: [@iishiishii](https://github.com/iishiishii)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/iishiishii/deepsyence/issues). 

## Show your support

Give a ⭐️ if this project helped you!
