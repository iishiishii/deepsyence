// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from "react";
import { boundingBox, modelInputProps } from "../helpers/Interfaces";
import { SegmentAnythingModel } from "../browser/samModel";
import * as ort from "onnxruntime-web";

interface contextProps {
  clicks: [
    clicks: modelInputProps[] | null,
    setClicks: (e: modelInputProps[] | null) => void,
  ];
  boxes: [boxes: boundingBox | null, setBoxes: (e: boundingBox | null) => void];
  maskImg: [
    maskImg: Uint8Array | null,
    setMaskImg: (e: Uint8Array | null) => void,
  ];
  penMode: [penMode: number, setPenMode: (e: number) => void];
  filled: [filled: boolean, setFilled: (e: boolean) => void];
  model: [
    model: SegmentAnythingModel | null,
    setModel: (e: SegmentAnythingModel | null) => void,
  ];
  modelLoading: [loading: boolean, setLoading: (e: boolean) => void];
}

const AppContext = createContext<contextProps | null>(null);

export default AppContext;
