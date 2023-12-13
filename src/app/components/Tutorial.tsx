import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS, Step } from 'react-joyride';
import { useState } from "react";

interface State {
  run: boolean;
  mouseClick: boolean;
  stepIndex: number;
  steps: Step[];
}

export default function Tutorial() {
  const [{ run, mouseClick, stepIndex, steps }, setState] = useState<State>({
    run: false,
    mouseClick: false,
    stepIndex: 0,
    steps: [
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
          "Once the processing is done, you can right-drag to create a bounding box.",
      },
      {
        target: ".niivue",
        title: "Select an ROI for Segmentation",
        content:
          "Then, simply left-click on any Region of Interest (ROI) within the image.",
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
    ],
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;
    console.log("index", index);
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Need to set our running state to false, so we can restart if we click start again.
      setState({ run: false, mouseClick:mouseClick, stepIndex: 0, steps: steps }); 
    } else if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      if (mouseClick && index === 6) {
        setTimeout(() => {
          setState({ run: true, mouseClick:mouseClick, stepIndex: stepIndex, steps: steps });
        }, 400);
      } else if (mouseClick && index === 1) {
        setState({
          run: false,
          mouseClick: false,
          stepIndex: nextStepIndex,
          steps: steps,
        });

        setTimeout(() => {
          setState({ run: true, mouseClick:mouseClick, stepIndex: stepIndex, steps: steps });
        }, 400);
      } else if (index === 2 && action === ACTIONS.PREV) {
        setState({
          run: false,
          mouseClick: true,
          stepIndex: nextStepIndex,
          steps: steps
        });

        setTimeout(() => {
          setState({ run: true, mouseClick:false, stepIndex: 0, steps: steps });
        }, 400);
      } else {
        // Update state to advance the tour
        setState({
          run: run,
          mouseClick: false,
          stepIndex: nextStepIndex,
          steps: steps,
        });
      }
    }

  };

  const right_click = new URL("./right-click.png", document.baseURI).href;
  const left_click = new URL("./left-click.png", document.baseURI).href;

  return (
    <div>
        {stepIndex === 6 ?  <div className='box'><img className="image-color" id="pic1" width="90" src={right_click}/> </div>: null}
        {stepIndex === 7 ?  <div className='box'><img className="image-color" id="pic2" width="90" src={left_click}/> </div>: null}
      <Joyride
        steps={steps}
        continuous={true}
        callback={handleJoyrideCallback}
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
