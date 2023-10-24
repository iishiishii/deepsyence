// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useState } from "react";
import { modelInputProps } from "../helpers/Interfaces";
import { SegmentAnythingModel } from "../browser/samModel";
import AppContext from "./createContext";

const AppContextProvider = (props: {
  children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}) => {
  const [clicks, setClicks] = useState<Array<modelInputProps> | null>(null);
  const [embedded, setEmbedded] = useState<Array<Float32Array> | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  const [penMode, setPenMode] = useState<number>(-1);
  const [filled, setFilled] = useState<boolean>(false);
  const [model, setModel] = useState<SegmentAnythingModel | null>(null);

  return (
    <AppContext.Provider
      value={{
        clicks: [clicks, setClicks],
        embedded: [embedded, setEmbedded],
        maskImg: [maskImg, setMaskImg],
        penMode: [penMode, setPenMode],
        filled: [filled, setFilled],
        model: [model, setModel],
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
