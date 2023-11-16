import { notification } from "antd";

export const handleJobNotification = (
  message: string,
  error: boolean = true,
) => {
  // const { job } = jobNotification;
  // if (job.status === JobStatus.NOT_STARTED) {
  //   notification.info({
  //     message: `${job.type} job added to queue`,
  //     description: (
  //       <div>
  //         View the queue in the{" "}

  //       </div>
  //     ),
  //     placement: "topRight",
  //     duration: 6,
  //   });
  // } else if (job.status === JobStatus.COMPLETE) {
  //   let description = <div />;
  //   if (job.type === JobType.LOAD_MODEL) {
  //     description = <div>Selected model will now be initialized</div>;
  //   } else if (
  //     job.type === JobType.RUN_MODEL
  //   ) {
  //     description = (
  //       <div>
  //         Model runned succesfully.{" "}
  //       </div>
  //     );
  //   } 
  if (error) {
    notification.error({
      message: `Error`,
      description: (
        <div>
          {message}
        </div>
      ),
      placement: "topRight",
      duration: 8,
    });
  } else {
    notification.success({
      message: `Success`,
      description: (
              <div>
                {message} succesfully finished
              </div>
            ),
      placement: "topRight",
      duration: 6,
    });
  }
};
