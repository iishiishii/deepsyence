// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useState } from "react";
import { boundingBox, modelInputProps } from "../helpers/Interfaces";
import { SegmentAnythingModel } from "../browser/samModel";
import { UnetModel } from "../browser/unetModel";
import AppContext from "./createContext";
import * as ort from "onnxruntime-web";

const AppContextProvider = (props: {
  children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}) => {
  const [clicks, setClicks] = useState<modelInputProps[] | null>(null); // set empty array in layer instead of context to avoid wrong appending if new image is added
  const [bbox, setBbox] = useState<boundingBox | null>(null);
  // const [embedded, setEmbedded] = useState<Array<ort.Tensor> | null>(null);
  const [maskImg, setMaskImg] = useState<Uint8Array | null>(null);
  const [penMode, setPenMode] = useState<number>(-1);
  const [filled, setFilled] = useState<boolean>(false);
  const [model, setModel] = useState<SegmentAnythingModel | UnetModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [positivePoints, setPositivePoints] = useState<boolean>(true);

  return (
    <AppContext.Provider
      value={{
        clicks: [clicks, setClicks],
        bbox: [bbox, setBbox],
        maskImg: [maskImg, setMaskImg],
        penMode: [penMode, setPenMode],
        filled: [filled, setFilled],
        model: [model, setModel],
        modelLoading: [loading, setLoading],
        positivePoints: [positivePoints, setPositivePoints],
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
