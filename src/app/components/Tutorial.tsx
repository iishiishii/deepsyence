import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  STATUS,
  Step,
} from "react-joyride";
import { useState } from "react";

interface State {
  stepIndex: number;
  steps: Step[];
}

export default function Tutorial() {
  const [{ stepIndex, steps }, setState] = useState<State>({
    stepIndex: 0,
    steps: [
      {
        target: "body",
        title: "Welcome to niivue-segmentation",
        content:
          "This tool allows you to generate lesion segmentations and customize labels using the built-in drawing tool.",
        disableBeacon: true,
        placement: "center",
        styles: {
          options: {
            width: 400,
          },
        },
      },
      // {
      //   target: ".niivue",
      //   title: "Upload an Image",
      //   content: "Drag and drop an image here to get started",
      // },
      // {
      //   target: ".navbar-file",
      //   title: "Upload an Image",
      //   placement: "bottom-start",
      //   content:
      //     "You can also click the Upload button in the navigation bar to select an image from your computer",
      //   disableBeacon: true,
      // },
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
        title: "Select a region of interest",
        content:
          "Once the processing is done, you can right-drag to create a bounding box.",
      },
      {
        target: ".niivue",
        title: "Select a region of interest",
        content:
          "Then, simply left-click on any region of interest within the image.",
      },
      {
        target: ".navbar-foreground-point",
        title: "Refine Segmentation",
        content:
          "By default, clicking will select the region of interest. Use this button to set clicking for selecting the region of interest.",
      },
      {
        target: ".navbar-background-point",
        title: "Refine Segmentation",
        content:
          "Use this button to set clicking for selecting the background.",
      },
      {
        target: ".navbar-draw",
        title: "Refine Segmentation",
        content:
          "To customize or refine the segmentation of the selected region of interest, use the drawing tools. These tools allow you to add or remove labels, adjust boundaries.",
      },
      {
        target: ".navbar-file",
        title: "Save Your Segmentation",
        content:
          "Once you are satisfied with the segmentation and labeling, you can save your work. Click the Download button to save the customized segmentation.",
      },
    ],
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Need to set our running state to false, so we can restart if we click start again.
      setState({
        stepIndex: 0,
        steps: steps,
      });
    } else if (
      ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)
    ) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      // Update state to advance the tour
      setState({
        stepIndex: nextStepIndex,
        steps: steps,
      });
    }
  };

  const right_click = new URL("./right-click.png", document.baseURI).href;
  const left_click = new URL("./left-click.png", document.baseURI).href;

  return (
    <div>
      {stepIndex === 3 ? (
        <div className="box">
          <img className="image-color" id="pic1" width="90" src={right_click} />{" "}
        </div>
      ) : null}
      {stepIndex === 4 ? (
        <div className="box">
          <img className="image-color" id="pic2" width="90" src={left_click} />{" "}
        </div>
      ) : null}
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
