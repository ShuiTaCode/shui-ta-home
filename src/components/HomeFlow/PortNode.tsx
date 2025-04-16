import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, Typography } from '@mui/material';

interface PortNodeData {
  label: string;
  nodeType: 'input' | 'output';
  isPortNode: true;
}

const PortNode = ({ data }: NodeProps<PortNodeData>) => {
  const isInput = data.nodeType === 'input';

  return (
    <Card sx={{ 
      width: '100%',
      cursor: 'pointer',
      border: '1px solid #ccc',
      backgroundColor: 'white',
      position: 'relative',
      boxShadow: 'none'
    }}>
      {isInput ? (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#555' }}
        />
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#555' }}
        />
      )}
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {data.label}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default memo(PortNode); 