import { useRef, useState } from "react";
import { Metadata, ModelSelectorProps } from "../helpers/Interfaces";
import { ListImageModels } from "../browser/sessionParams";

export default function ModelSelector(props: ModelSelectorProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [metadata, setMetadata] = useState({
    models: [] as Metadata[],
  });

  useState(() => {
    if (props.imageType !== undefined) {
      const models = ListImageModels(props.tags, props.imageType);
      console.log("```````````` models", models, props.imageType);
      setMetadata({ models: models });
    }
  });

  const selectModel = () => {
    const id = selectRef.current?.value;
    if (id !== undefined) {
      props.callback(id);
      console.log(`selected model ${id}`);
    }
  };

  return (
    <div className="row mb-2">
      <div className="col-md-10 col-sm-12 mt-1">
        <select
          onClick={(e) => {
            e.stopPropagation();
          }}
          ref={selectRef}
          className="form-select"
        >
          {metadata.models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.title}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-2 col-sm-12 mt-1">
        <button
          className="btn btn-primary btn-block"
          style={{ width: "100%" }}
          onClick={selectModel}
        >
          Select
        </button>
      </div>
    </div>
  );
}
