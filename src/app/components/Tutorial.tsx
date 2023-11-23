import Joyride from "react-joyride";
import { Step } from "react-joyride";

const steps: Array<Step> = [
    {
      target: "body",
      title: "Welcome to niivue-segmentation",
      content:
        "This tool allows you to generate Region of Interest (ROI) segmentations and customize labels using the built-in drawing tool.",
      disableBeacon: true,
      placement: "center",
      styles: {
        options: {
          width: 400,
        },
      },
    },
    {
      target: ".niivue",
      title: "Upload an Image",
      content: "Drag and drop an image here to get started",
    },
    {
      target: ".navbar-file",
      title: "Upload an Image",
      placement: "bottom-start",
      content:
        "You can also click the Upload button in the navigation bar to select an image from your computer",
      disableBeacon: true,
    },
    {
      target: ".navbar-model",
      title: "Select the Segmentation Model",
      placement: "bottom-start",
      content:
        "Once you have your image loaded, you need to select a segmentation model to process the image.",
    },
    {
      target: '[data-testid="PlayCircleFilledWhiteIcon"]',
      title: "Start Image Processing",
      content:
        "Click the Run button to begin image processing using the selected model. This process may take a moment, and you'll see a progress indicator.",
      // disableBeacon: true,
    },
    {
      target: '[role="progressbar"]',
      title: "Wait for Completion",
      content:
        "You'll see a 100% indicator once the image processing is complete. Be patient as the model take long time to encode image.",
    },
    {
      target: ".niivue",
      title: "Select an ROI for Segmentation",
      content:
        "After processing, you can click on any Region of Interest (ROI) within the image.",
      disableBeacon: true,
    },
    {
      target: ".navbar-draw",
      title: "Refine Segmentation",
      content:
        "To customize or refine the segmentation of the selected ROI, use the drawing tools. These tools allow you to add or remove labels, adjust boundaries.",
    },
    {
      target: ".navbar-file",
      title: "Save Your Segmentation",
      content:
        "Once you are satisfied with the segmentation and labeling, you can save your work. Click the Download button to save the customized ROI segmentation.",
    },
  ];
  
    export default function Tutorial() {
        return (
            <div>
                <Joyride
                    steps={steps}

                    continuous={true}
                    styles={{
                    options: {
                        arrowColor: "#5caeab",
                        backgroundColor: "#5caeab",
                        overlayColor: "rgba(255, 255, 255, .3)",
                        primaryColor: "#5caeab",
                        textColor: "#fff",
                        zIndex: 100,
                    },
                    }}
                    // Add this
                    showProgress={true}
                    showSkipButton={true}
                />
            </div>
        );
    }