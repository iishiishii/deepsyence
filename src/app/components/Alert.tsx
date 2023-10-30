import { notification } from "antd";

export const handleJobNotification = (
  error: string,
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
  //   notification.success({
  //     message: `${job.type} succesfully finished`,
  //     description,
  //     placement: "topRight",
  //     duration: 6,
  //   });
  // } else if (job.status === JobStatus.FAILED) {
    notification.error({
      message: `${error} failed`,
      description: (
        <div>
          Job failed with error: {error}
        </div>
      ),
      placement: "topRight",
      duration: 6,
    });
  // }
};
