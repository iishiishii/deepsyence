// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from "react";
import { modelInputProps } from "../helpers/Interfaces";
import { SegmentAnythingModel } from "../browser/samModel";

interface contextProps {
  clicks: [
    clicks: modelInputProps[] | null,
    setClicks: (e: modelInputProps[] | null) => void,
  ];
  embedded: [
    embedded: Array<Float32Array> | null,
    setEmbedded: (e: Array<Float32Array> | null) => void,
  ];
  maskImg: [
    maskImg: HTMLImageElement | null,
    setMaskImg: (e: HTMLImageElement | null) => void,
  ];
  penMode: [penMode: number, setPenMode: (e: number) => void];
  filled: [filled: boolean, setFilled: (e: boolean) => void];
  model: [model: SegmentAnythingModel | null, setModel: (e: SegmentAnythingModel | null) => void];
}

const AppContext = createContext<contextProps | null>(null);

export default AppContext;
