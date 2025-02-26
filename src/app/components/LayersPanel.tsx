import { Box } from "@mui/material";

export function LayersPanel(props: any) {
  return (
    <div
      style={{
        width: "25%",
        overflow: "hidden",
        // overflowY: "scroll",
        marginRight: "5px",
        borderRadius: 1,
        border: "1px solid grey",
        boxShadow: "3px white inset",
        backgroundColor: "#2d2e31",
        // opacity: [0.9, 0.8, 0.8],
      }}
    >

      <Box
        sx={{
          width: props.width,
          role: "presentation",
          display: "flex",
          height: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          // ml: 1,
          // mr: 1,
        }}
      >
        {props.children}
      </Box>
    </div>
  );
}
