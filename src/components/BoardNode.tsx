import { Handle, Position } from 'reactflow';

interface BoardNodeProps {
  data: {
    label: string;
    inputs: string[];
    outputs: string[];
  };
}

export default function BoardNode({ data }: BoardNodeProps) {
  const { label, inputs, outputs } = data;
  
  return (
    <div className="custom-board">
      <div className="custom-board__header">
        {label}
      </div>
      
      <div className="custom-board__body">
        <div className="custom-board__column">
          <div className="custom-board__label">Inputs</div>
          {inputs.map((input, index) => (
            <div key={`input-${index}`} className="custom-board__port">
              <Handle
                type="target"
                position={Position.Left}
                id={`input-${index}`}
                className="custom-board__handle"
              />
              <span className="custom-board__port-text">{input}</span>
            </div>
          ))}
        </div>

        <div className="custom-board__column">
          <div className="custom-board__label">Outputs</div>
          {outputs.map((output, index) => (
            <div key={`output-${index}`} className="custom-board__port">
              <span className="custom-board__port-text">{output}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`output-${index}`}
                className="custom-board__handle"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 