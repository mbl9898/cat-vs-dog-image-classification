import { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import "./App.css";
import ImageUpload from "./image-upload";

const TARGET_CLASSES = {
  0: "Cat",
  1: "Dog",
};

const App = () => {
  const [model, setModel] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [wrongPredictions, setWrongPredictions] = useState([]);

  const loadModel = async () => {
    try {
      setLoading(true);
      const loadedModel = await tf.loadLayersModel(
        // "https://raw.githubusercontent.com/mbl9898/assets/main/model.json"
        "http://localhost:5173/model_1/catndog_model.json"
      );
      setModel(loadedModel);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const addWrong = ({ src, className }) => {
    const arr = [...wrongPredictions, { src, className }];
    setWrongPredictions(arr);
  };

  const handleFiles = async (files) => {
    const imageArray = Array.from(files).map((file) => {
      var isDog = file.name.toLocaleLowerCase().endsWith("_1.jpg");

      return {
        src: URL.createObjectURL(file),
        className: isDog ? "Dog" : "Cat",
      };
    });
    setImages(imageArray);
  };

  const loadImages = async () => {
    const images = [];
    const labels = [];

    await Promise.all(
      wrongPredictions.map(async ({ src, className }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        let imageTensor = tf.browser
          .fromPixels(img)
          .resizeNearestNeighbor([96, 96])
          .toFloat()
          .div(tf.scalar(255.0))
          .expandDims();
        images.push(imageTensor);
        labels.push(className === "Dog" ? 1 : 0);
        return imageTensor;
      })
    );
    return {
      images: tf.concat(images),
      labels: tf.oneHot(tf.tensor1d(labels, "int32"), 2).toFloat(),
    };
  };
  const retrainModel = async () => {
    const { images, labels } = await loadImages();
    model.summary();
    const optimizer = tf.train.adam(0.0001);
    model.compile({
      optimizer: optimizer,
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    const validationSplit = 0.15;
    await model.fit(images, labels, {
      epochs: 50,
      batchSize: 20,
      validationSplit,
    });

    // const { images: testImages, labels: testLabels } = data.getTestData();
    // const evalOutput = model.evaluate(testImages, testLabels);

    // console.log(
    //   `\nEvaluation result:\n` +
    //     `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; ` +
    //     `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`
    // );

    const modelSavePath = "catndog_model";

    if (modelSavePath != null) {
      await model.save("downloads://catndog_model");
      console.log(`Saved model to path: ${modelSavePath}`);
    }
  };

  const predict = async () => {
    const imagesTemp = [...images];
    setPredicting(true);
    if (!model) return;

    const chunkSize = 25;
    for (let i = 0; i < images?.length; i += chunkSize) {
      const chunk = images.slice(i, i + chunkSize);
      await new Promise((res) => {
        setTimeout(async () => {
          const predictionsArray = await Promise.all(
            chunk.map(async ({ src, className }) => {
              const img = new Image();
              img.src = src;
              await img.decode();

              let tensor = tf.browser
                .fromPixels(img)
                .resizeNearestNeighbor([96, 96])
                .toFloat()
                .div(tf.scalar(255.0))
                .expandDims();

              let predictions = await model.predict(tensor).data();

              let top5 = Array.from(predictions)
                .map((p, i) => {
                  return {
                    probability: p,
                    className: TARGET_CLASSES[i],
                  };
                })
                .sort((a, b) => b?.probability - a?.probability)
                .slice(0, 2);

              const index = images.findIndex((x) => x?.src === src);

              return { src, predictions: top5, imageIndex: index, className };
            })
          );

          predictionsArray.forEach((prediction) => {
            imagesTemp[prediction?.imageIndex] = {
              src: prediction?.src,
              predictions: prediction?.predictions,
              className: prediction?.className,
            };
          });
          setImages(imagesTemp);
          res();
        }, 200);
      });
    }

    setPredicting(false);
  };

  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div className="container mt-5">
      <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
        <a className="navbar-brand" href="/">
          Cat Vs Dog Detector
        </a>
      </nav>
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="progress-bar progress-bar-striped progress-bar-animated mb-2">
              Loading Model
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-6">
          <ImageUpload handleFiles={handleFiles} />
        </div>
        <div className="col-6">
          <button onClick={predict} className="btn btn-primary float-right">
            {predicting ? "Loading..." : "Classify"}
          </button>
          <button
            onClick={retrainModel}
            className="btn btn-primary float-right"
          >
            Retrain Model
          </button>
        </div>
      </div>
      <hr />
      <div className="row">
        <div className="col-12">
          <h2 className="ml-3">Images and Predictions</h2>
          <div id="image-prediction-container" className="ml-3 row">
            {images?.map(({ src, predictions, className }) => (
              <div
                className="card col-3"
                key={src}
                style={{
                  backgroundColor: wrongPredictions?.find((x) => x?.src === src)
                    ? "red"
                    : "",
                }}
              >
                <div className="d-flex justify-content-center mb-auto">
                  <img
                    src={src}
                    className="selected-image"
                    width="250"
                    alt="selected-image"
                  />
                </div>
                <div className="prediction-list d-flex justify-content-between">
                  {predictions &&
                    predictions.map((p, i) => (
                      <li key={i}>
                        {p.className}: {p.probability.toFixed(6)}
                      </li>
                    ))}
                </div>
                {predictions && (
                  <button
                    style={{
                      backgroundColor:
                        className !== predictions?.[0]?.className ? "red" : "",
                    }}
                    onClick={() =>
                      addWrong({ src, className: predictions?.[1]?.className })
                    }
                    className="btn btn-primary float-right"
                  >
                    Is {predictions?.[1]?.className}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

const fileToArrayBuffer = (file) =>
  new Promise((res) => {
    var reader = new FileReader();
    reader.onload = () => {
      var arrayBuffer = reader?.result;
      res(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });

const loadImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => resolve(img);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(imageFile);
  });
};

//
//
//
//
//

// import * as tf from "@tensorflow/tfjs";

// // Function to read and preprocess an image file
// async function preprocessImage(imageFile) {
//   // Load the image file as an HTML image element
//   const image = await loadImage(imageFile);

//   // Convert the image to a tensor
//   let imageTensor = tf.browser.fromPixels(image);

//   // Resize, normalize, and expand dimensions
//   imageTensor = tf.image
//     .resizeBilinear(imageTensor, [96, 96])
//     .toFloat()
//     .div(tf.scalar(255.0))
//     .expandDims();

//   return imageTensor;
// }

// // Utility function to load an image file into an HTML image element
// function loadImage(imageFile) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       const img = new Image();
//       img.src = reader.result;
//       img.onload = () => resolve(img);
//     };
//     reader.onerror = (error) => reject(error);
//     reader.readAsDataURL(imageFile);
//   });
// }

// // Example usage with file input
// document
//   .getElementById("fileInput")
//   .addEventListener("change", async (event) => {
//     const files = event.target.files;
//     const images = [];

//     for (const file of files) {
//       const imageTensor = await preprocessImage(file);
//       images.push(imageTensor);
//     }

//     // At this point, `images` is an array of preprocessed image tensors
//     console.log(images);
//   });
