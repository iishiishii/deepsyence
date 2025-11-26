export class StandardScaler {
  private mean: number | null = null;
  private std: number | null = null;
  private fitted: boolean = false;

  /**
   * Fit the scaler on training data
   */
  fit(data: Float32Array | number[]): void {
    const n = data.length;
    if (n === 0) {
      throw new Error("Cannot fit StandardScaler on empty data");
    }

    // Calculate mean
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += data[i];
    }
    this.mean = sum / n;

    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (let i = 0; i < n; i++) {
      const diff = data[i] - this.mean;
      sumSquaredDiff += diff * diff;
    }
    this.std = Math.sqrt(sumSquaredDiff / n);

    // Avoid division by zero
    if (this.std === 0) {
      this.std = 1.0;
      console.warn(
        "StandardScaler: std is 0, setting to 1.0 to avoid division by zero"
      );
    }

    this.fitted = true;
    console.log(
      `StandardScaler fitted: mean=${this.mean.toFixed(2)}, std=${this.std.toFixed(2)}`
    );
  }

  /**
   * Transform data using fitted parameters
   */
  transform(data: Float32Array): Float32Array {
    if (!this.fitted || this.mean === null || this.std === null) {
      throw new Error("StandardScaler must be fitted before transform");
    }

    const transformed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      transformed[i] = (data[i] - this.mean) / this.std;
    }
    return transformed;
  }

  /**
   * Fit and transform in one step
   */
  fitTransform(data: Float32Array | number[]): Float32Array {
    this.fit(data);
    const dataArray =
      data instanceof Float32Array ? data : new Float32Array(data);
    return this.transform(dataArray);
  }

  /**
   * Inverse transform (denormalize)
   */
  inverseTransform(data: Float32Array): Float32Array {
    if (!this.fitted || this.mean === null || this.std === null) {
      throw new Error("StandardScaler must be fitted before inverse_transform");
    }

    const original = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      original[i] = data[i] * this.std + this.mean;
    }
    return original;
  }

  /**
   * Get the fitted parameters
   */
  getParams(): { mean: number; std: number } | null {
    if (!this.fitted || this.mean === null || this.std === null) {
      return null;
    }
    return { mean: this.mean, std: this.std };
  }

  /**
   * Set parameters manually (useful for loading saved scalers)
   */
  setParams(mean: number, std: number): void {
    this.mean = mean;
    this.std = std;
    this.fitted = true;
  }

  /**
   * Reset the scaler
   */
  reset(): void {
    this.mean = null;
    this.std = null;
    this.fitted = false;
  }

  /**
   * Check if scaler is fitted
   */
  isFitted(): boolean {
    return this.fitted;
  }

  /**
   * Save scaler parameters to JSON
   */
  toJSON(): { mean: number; std: number } {
    if (!this.fitted || this.mean === null || this.std === null) {
      throw new Error("Cannot save unfitted StandardScaler");
    }
    return { mean: this.mean, std: this.std };
  }

  /**
   * Load scaler parameters from JSON
   */
  static fromJSON(json: { mean: number; std: number }): StandardScaler {
    const scaler = new StandardScaler();
    scaler.setParams(json.mean, json.std);
    return scaler;
  }
}
