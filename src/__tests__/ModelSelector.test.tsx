
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelType } from "../app/browser/sessionParams";
import ModelSelector from '../app/components/ModelSelector';
import { ModelSelectorProps } from '../app/components/ModelSelector'; // Adjust the import based on your actual file structure

// configure({ adapter: new Adapter(), disableLifecycleMethods: true });
describe('ModelSelector Component', () => {
  test('should render correctly', () => {
    const props: ModelSelectorProps = {
      tags: ['tag1', 'tag2'],
      imageType: [ModelType.Unet],
      callback: jest.fn(),
    };
    render(<ModelSelector {...props} />);
    // expect(wrapper).toMatchSnapshot();
  });

  test('should call callback function when select button is clicked', () => {
    const props: ModelSelectorProps = {
      tags: ['tag1', 'tag2'],
      imageType: [ModelType.Unet],
      callback: jest.fn(),
    };
    render(<ModelSelector {...props} />);
    const selectButton = screen.getByText('Select');
    fireEvent.click(selectButton);
    expect(props.callback).toHaveBeenCalled();
  });
});