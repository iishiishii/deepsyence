function Resize(
    widthOriginal,
    heightOriginal,
    targetWidth,
    targetHeight,
    blendAlpha,
    interpolationPass,
    resizeCallback
  ) {
    this.widthOriginal = Math.abs(Math.floor(widthOriginal) || 0);
    this.heightOriginal = Math.abs(Math.floor(heightOriginal) || 0);
    this.targetWidth = Math.abs(Math.floor(targetWidth) || 0);
    this.targetHeight = Math.abs(Math.floor(targetHeight) || 0);
    this.colorChannels = blendAlpha ? 4 : 3;
    this.interpolationPass = Boolean(interpolationPass);
    this.resizeCallback =
      typeof resizeCallback === "function" ? resizeCallback : function () {};
  
    this.targetWidthMultipliedByChannels = this.targetWidth * this.colorChannels;
    this.originalWidthMultipliedByChannels =
      this.widthOriginal * this.colorChannels;
    this.originalHeightMultipliedByChannels =
      this.heightOriginal * this.colorChannels;
    this.widthPassResultSize =
      this.targetWidthMultipliedByChannels * this.heightOriginal;
    this.finalResultSize =
      this.targetWidthMultipliedByChannels * this.targetHeight;
    this.initialize();
  }
  
  Resize.prototype.initialize = function () {
    // Perform some checks:
    if (
      this.widthOriginal > 0 &&
      this.heightOriginal > 0 &&
      this.targetWidth > 0 &&
      this.targetHeight > 0
    ) {
      this.configurePasses();
    } else {
      throw new Error("Invalid settings specified for the resizer.");
    }
  };
  
  Resize.prototype.configurePasses = function () {
    if (this.widthOriginal === this.targetWidth) {
      // Bypass the width resizer pass:
      this.resizeWidth = this.bypassResizer;
    } else {
      // Setup the width resizer pass:
      this.ratioWeightWidthPass = this.widthOriginal / this.targetWidth;
      if (this.ratioWeightWidthPass < 1 && this.interpolationPass) {
        this.initializeFirstPassBuffers(true);
        this.resizeWidth = this.resizeWidthInterpolatedRGB;
      } else {
        this.initializeFirstPassBuffers(false);
        this.resizeWidth =
          this.colorChannels === this.resizeWidthRGB;
      }
    }
  
    if (this.heightOriginal === this.targetHeight) {
      // Bypass the height resizer pass:
      this.resizeHeight = this.bypassResizer;
    } else {
      // Setup the height resizer pass:
      this.ratioWeightHeightPass = this.heightOriginal / this.targetHeight;
      if (this.ratioWeightHeightPass < 1 && this.interpolationPass) {
        this.initializeSecondPassBuffers(true);
        this.resizeHeight = this.resizeHeightInterpolated;
      } else {
        this.initializeSecondPassBuffers(false);
        this.resizeHeight =
          this.colorChannels === this.resizeHeightRGB;
      }
    }
  };
  
  Resize.prototype._resizeWidthInterpolatedRGBChannels = function (
    buffer
  ) {
    const channelsNum = 3;
    const ratioWeight = this.ratioWeightWidthPass;
    const outputBuffer = this.widthBuffer;
  
    let weight = 0;
    let finalOffset = 0;
    let pixelOffset = 0;
    let firstWeight = 0;
    let secondWeight = 0;
    let targetPosition;
  
    // Handle for only one interpolation input being valid for start calculation:
    for (
      targetPosition = 0;
      weight < 1 / 3;
      targetPosition += channelsNum, weight += ratioWeight
    ) {
      for (
        finalOffset = targetPosition, pixelOffset = 0;
        finalOffset < this.widthPassResultSize;
        pixelOffset += this.originalWidthMultipliedByChannels,
          finalOffset += this.targetWidthMultipliedByChannels
      ) {
        outputBuffer[finalOffset] = buffer[pixelOffset];
        outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1];
        outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2];
      }
    }
  
    // Adjust for overshoot of the last pass's counter:
    weight -= 1 / 3;
    let interpolationWidthSourceReadStop;
  
    for (
      interpolationWidthSourceReadStop = this.widthOriginal - 1;
      weight < interpolationWidthSourceReadStop;
      targetPosition += channelsNum, weight += ratioWeight
    ) {
      // Calculate weightings:
      secondWeight = weight % 1;
      firstWeight = 1 - secondWeight;
      // Interpolate:
      for (
        finalOffset = targetPosition,
          pixelOffset = Math.floor(weight) * channelsNum;
        finalOffset < this.widthPassResultSize;
        pixelOffset += this.originalWidthMultipliedByChannels,
          finalOffset += this.targetWidthMultipliedByChannels
      ) {
        outputBuffer[finalOffset + 0] =
          buffer[pixelOffset + 0] * firstWeight +
          buffer[pixelOffset + channelsNum + 0] * secondWeight;
        outputBuffer[finalOffset + 1] =
          buffer[pixelOffset + 1] * firstWeight +
          buffer[pixelOffset + channelsNum + 1] * secondWeight;
        outputBuffer[finalOffset + 2] =
          buffer[pixelOffset + 2] * firstWeight +
          buffer[pixelOffset + channelsNum + 2] * secondWeight;
      }
    }
  
    // Handle for only one interpolation input being valid for end calculation:
    for (
      interpolationWidthSourceReadStop =
        this.originalWidthMultipliedByChannels - channelsNum;
      targetPosition < this.targetWidthMultipliedByChannels;
      targetPosition += channelsNum
    ) {
      for (
        finalOffset = targetPosition,
          pixelOffset = interpolationWidthSourceReadStop;
        finalOffset < this.widthPassResultSize;
        pixelOffset += this.originalWidthMultipliedByChannels,
          finalOffset += this.targetWidthMultipliedByChannels
      ) {
        outputBuffer[finalOffset] = buffer[pixelOffset];
        outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1];
        outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2];
      }
    }
  
    return outputBuffer;
  };
  
  Resize.prototype._resizeWidthRGBChannels = function (buffer) {
    const channelsNum = 3;
    const ratioWeight = this.ratioWeightWidthPass;
    const ratioWeightDivisor = 1 / ratioWeight;
    const nextLineOffsetOriginalWidth =
      this.originalWidthMultipliedByChannels - channelsNum + 1;
    const nextLineOffsetTargetWidth =
      this.targetWidthMultipliedByChannels - channelsNum + 1;
    const output = this.outputWidthWorkBench;
    const outputBuffer = this.widthBuffer;
    const trustworthyColorsCount = this.outputWidthWorkBenchOpaquePixelsCount;
  
    let weight = 0;
    let amountToNext = 0;
    let actualPosition = 0;
    let currentPosition = 0;
    let line = 0;
    let pixelOffset = 0;
    let outputOffset = 0;
    let multiplier = 1;
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
  
    do {
      for (line = 0; line < this.originalHeightMultipliedByChannels; ) {
        output[line++] = 0;
        output[line++] = 0;
        output[line++] = 0;
      }
  
      weight = ratioWeight;
  
      do {
        amountToNext = 1 + actualPosition - currentPosition;
        multiplier = Math.min(weight, amountToNext);
        for (
          line = 0, pixelOffset = actualPosition;
          line < this.originalHeightMultipliedByChannels;
          pixelOffset += nextLineOffsetOriginalWidth
        ) {
          r = buffer[pixelOffset];
          g = buffer[++pixelOffset];
          b = buffer[++pixelOffset];
        }
  
        if (weight >= amountToNext) {
          actualPosition += channelsNum;
          currentPosition = actualPosition;
          weight -= amountToNext;
        } else {
          currentPosition += weight;
          break;
        }
      } while (
        weight > 0 &&
        actualPosition < this.originalWidthMultipliedByChannels
      );
  
      for (
        line = 0, pixelOffset = outputOffset;
        line < this.originalHeightMultipliedByChannels;
        pixelOffset += nextLineOffsetTargetWidth
      ) {
        multiplier = ratioWeightDivisor;
        outputBuffer[pixelOffset] = output[line++] * multiplier;
        outputBuffer[++pixelOffset] = output[line++] * multiplier;
        outputBuffer[++pixelOffset] = output[line++] * multiplier;
      }
  
      outputOffset += channelsNum;
    } while (outputOffset < this.targetWidthMultipliedByChannels);
  
    return outputBuffer;
  };
  
  Resize.prototype._resizeHeightRGBChannels = function (buffer) {
    const ratioWeight = this.ratioWeightHeightPass;
    const ratioWeightDivisor = 1 / ratioWeight;
    const output = this.outputHeightWorkBench;
    const outputBuffer = this.heightBuffer;
    const trustworthyColorsCount = this.outputHeightWorkBenchOpaquePixelsCount;
  
    let weight = 0;
    let amountToNext = 0;
    let actualPosition = 0;
    let currentPosition = 0;
    let pixelOffset = 0;
    let outputOffset = 0;
    let caret = 0;
    let multiplier = 1;
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
  
    do {
      for (
        pixelOffset = 0;
        pixelOffset < this.targetWidthMultipliedByChannels;
  
      ) {
        output[pixelOffset++] = 0;
        output[pixelOffset++] = 0;
        output[pixelOffset++] = 0;
      }
  
      weight = ratioWeight;
  
      do {
        amountToNext = 1 + actualPosition - currentPosition;
        multiplier = Math.min(weight, amountToNext);
        caret = actualPosition;
  
        for (
          pixelOffset = 0;
          pixelOffset < this.targetWidthMultipliedByChannels;
  
        ) {
          r = buffer[caret++];
          g = buffer[caret++];
          b = buffer[caret++];
        }
  
        if (weight >= amountToNext) {
          actualPosition = caret;
          currentPosition = actualPosition;
          weight -= amountToNext;
        } else {
          currentPosition += weight;
          break;
        }
      } while (weight > 0 && actualPosition < this.widthPassResultSize);
  
      for (
        pixelOffset = 0;
        pixelOffset < this.targetWidthMultipliedByChannels;
  
      ) {
        multiplier = ratioWeightDivisor;
        outputBuffer[outputOffset++] = Math.round(
          output[pixelOffset++] * multiplier
        );
        outputBuffer[outputOffset++] = Math.round(
          output[pixelOffset++] * multiplier
        );
        outputBuffer[outputOffset++] = Math.round(
          output[pixelOffset++] * multiplier
        );
      }
    } while (outputOffset < this.finalResultSize);
  
    return outputBuffer;
  };
  
  Resize.prototype.resizeWidthInterpolatedRGB = function (buffer) {
    return this._resizeWidthInterpolatedRGBChannels(buffer);
  };
  
  Resize.prototype.resizeWidthRGB = function (buffer) {
    return this._resizeWidthRGBChannels(buffer);
  };
  
  Resize.prototype.resizeHeightInterpolated = function (buffer) {
    const ratioWeight = this.ratioWeightHeightPass;
    const outputBuffer = this.heightBuffer;
  
    let weight = 0;
    let finalOffset = 0;
    let pixelOffset = 0;
    let pixelOffsetAccumulated = 0;
    let pixelOffsetAccumulated2 = 0;
    let firstWeight = 0;
    let secondWeight = 0;
    let interpolationHeightSourceReadStop;
  
    // Handle for only one interpolation input being valid for start calculation:
    for (; weight < 1 / 3; weight += ratioWeight) {
      for (
        pixelOffset = 0;
        pixelOffset < this.targetWidthMultipliedByChannels;
  
      ) {
        outputBuffer[finalOffset++] = Math.round(buffer[pixelOffset++]);
      }
    }
  
    // Adjust for overshoot of the last pass's counter:
    weight -= 1 / 3;
  
    for (
      interpolationHeightSourceReadStop = this.heightOriginal - 1;
      weight < interpolationHeightSourceReadStop;
      weight += ratioWeight
    ) {
      // Calculate weightings:
      secondWeight = weight % 1;
      firstWeight = 1 - secondWeight;
      // Interpolate:
      pixelOffsetAccumulated =
        Math.floor(weight) * this.targetWidthMultipliedByChannels;
      pixelOffsetAccumulated2 =
        pixelOffsetAccumulated + this.targetWidthMultipliedByChannels;
      for (
        pixelOffset = 0;
        pixelOffset < this.targetWidthMultipliedByChannels;
        ++pixelOffset
      ) {
        outputBuffer[finalOffset++] = Math.round(
          buffer[pixelOffsetAccumulated++] * firstWeight +
            buffer[pixelOffsetAccumulated2++] * secondWeight
        );
      }
    }
  
    // Handle for only one interpolation input being valid for end calculation:
    while (finalOffset < this.finalResultSize) {
      for (
        pixelOffset = 0,
          pixelOffsetAccumulated =
            interpolationHeightSourceReadStop *
            this.targetWidthMultipliedByChannels;
        pixelOffset < this.targetWidthMultipliedByChannels;
        ++pixelOffset
      ) {
        outputBuffer[finalOffset++] = Math.round(
          buffer[pixelOffsetAccumulated++]
        );
      }
    }
  
    return outputBuffer;
  };
  
  Resize.prototype.resizeHeightRGB = function (buffer) {
    return this._resizeHeightRGBChannels(buffer);
  };
  
  Resize.prototype.resize = function (buffer) {
    this.resizeCallback(this.resizeHeight(this.resizeWidth(buffer)));
  };
  
  Resize.prototype.bypassResizer = function (buffer) {
    // Just return the buffer passed:
    return buffer;
  };
  
  Resize.prototype.initializeFirstPassBuffers = function (BILINEARAlgo) {
    // Initialize the internal width pass buffers:
    this.widthBuffer = this.generateFloatBuffer(this.widthPassResultSize);
  
    if (!BILINEARAlgo) {
      this.outputWidthWorkBench = this.generateFloatBuffer(
        this.originalHeightMultipliedByChannels
      );
  
      if (this.colorChannels > 3) {
        this.outputWidthWorkBenchOpaquePixelsCount = this.generateFloat64Buffer(
          this.heightOriginal
        );
      }
    }
  };
  
  Resize.prototype.initializeSecondPassBuffers = function (BILINEARAlgo) {
    // Initialize the internal height pass buffers:
    this.heightBuffer = this.generateUint8Buffer(this.finalResultSize);
  
    if (!BILINEARAlgo) {
      this.outputHeightWorkBench = this.generateFloatBuffer(
        this.targetWidthMultipliedByChannels
      );
  
      if (this.colorChannels > 3) {
        this.outputHeightWorkBenchOpaquePixelsCount = this.generateFloat64Buffer(
          this.targetWidth
        );
      }
    }
  };
  
  Resize.prototype.generateFloatBuffer = function (bufferLength) {
    // Generate a float32 typed array buffer:
    try {
      return new Float32Array(bufferLength);
    } catch (error) {
      return [];
    }
  };
  
  Resize.prototype.generateFloat64Buffer = function (bufferLength) {
    // Generate a float64 typed array buffer:
    try {
      return new Float64Array(bufferLength);
    } catch (error) {
      return [];
    }
  };
  
  Resize.prototype.generateUint8Buffer = function (bufferLength) {
    // Generate a uint8 typed array buffer:
    try {
      return new Uint8Array(bufferLength);
    } catch (error) {
      return [];
    }
  };
  
  export default Resize;