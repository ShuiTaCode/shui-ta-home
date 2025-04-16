import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, Typography, IconButton, Chip, Box, Divider, List, ListItem, ListItemText } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { NodeType, BoardPort } from '../../types';

const getNodeTypeColor = (type: NodeType) => {
  switch (type) {
    case 'sensor':
      return '#4caf50'; // Grün
    case 'motor':
      return '#f44336'; // Rot
    case 'light':
      return '#ff9800'; // Orange
    case 'board':
      return '#2196f3'; // Blau
    default:
      return '#9e9e9e'; // Grau
  }
};

const getNodeTypeLabel = (type: NodeType) => {
  switch (type) {
    case 'sensor':
      return 'Sensor';
    case 'motor':
      return 'Motor';
    case 'light':
      return 'Licht';
    case 'board':
      return 'Board';
    default:
      return 'Unbekannt';
  }
};

interface CustomNodeProps extends NodeProps {
  data: {
    label: string;
    content?: string;
    nodeType: NodeType;
    ports?: BoardPort[];
    onDelete?: () => void;
  };
}

const CustomNode = ({ data, isConnectable }: CustomNodeProps) => {
  const nodeType = data.nodeType as NodeType;
  const isBoard = nodeType === 'board';
  const ports = data.ports || [];

  const inputPorts = ports.filter(port => port.type === 'input');
  const outputPorts = ports.filter(port => port.type === 'output');

  return (
    <Card 
      elevation={0}
      sx={{ 
        width: '100%',
        cursor: 'pointer',
        border: isBoard ? '2px dashed #2196f3' : '1px solid #ccc',
        backgroundColor: isBoard ? 'rgba(33, 150, 243, 0.05)' : 'white',
        position: 'relative',
        boxShadow: 'none',
        '& .react-flow__handle': {
          width: 8,
          height: 8,
          background: '#555',
          zIndex: 1000
        },
        '& .react-flow__handle-left': {
          left: -4,
        },
        '& .react-flow__handle-right': {
          right: -4,
        }
    }}>
      {!isBoard && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            style={{ background: '#555', zIndex: 1000 }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: '#555', zIndex: 1000 }}
            isConnectable={isConnectable}
          />
        </>
      )}
      {isBoard && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="board-input"
            style={{ background: '#555', zIndex: 1000 }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="board-output"
            style={{ background: '#555', zIndex: 1000 }}
            isConnectable={isConnectable}
          />
        </>
      )}
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 0.5,
          position: 'relative', 
          zIndex: 2 
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            width: '100%'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '0.8rem',
                fontWeight: 'bold',
                flexGrow: 1,
                mr: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'rgba(0, 0, 0, 0.87)'
              }}
            >
              {data.label}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5, 
              flexShrink: 0
            }}>
              <IconButton 
                size="small" 
                sx={{ p: 0.5 }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (data.onDelete) data.onDelete();
                }}
              >
                <DeleteIcon sx={{ fontSize: '0.9rem', color: '#f44336' }} />
              </IconButton>
              <IconButton size="small" sx={{ p: 0.5 }}>
                <EditIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
          </Box>
          <Chip 
            label={getNodeTypeLabel(nodeType)} 
            size="small" 
            sx={{ 
              backgroundColor: getNodeTypeColor(nodeType),
              color: 'white',
              height: 20,
              alignSelf: 'flex-start',
              '& .MuiChip-label': {
                fontSize: '0.7rem',
                px: 1
              }
            }} 
          />
          {data.content && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
              {data.content}
            </Typography>
          )}
          
          {isBoard && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', minHeight: 60 }}>
                <Box sx={{ flex: 1, pr: 1 }}>
                  <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.65rem' }}>Inputs</Typography>
                  <List dense sx={{ py: 0, maxHeight: 120, overflowY: 'auto' }}>
                    {inputPorts.map(port => (
                      <ListItem key={port.id} sx={{ py: 0.25 }}>
                        <Handle 
                          type="target" 
                          position={Position.Left} 
                          id={port.id}
                          isConnectable={isConnectable}
                          style={{ 
                            background: port.connectedTo ? '#4caf50' : '#9e9e9e',
                            width: 8,
                            height: 8,
                            left: -4,
                            zIndex: 1000
                          }} 
                        />
                        <ListItemText 
                          primary={port.name} 
                          primaryTypographyProps={{ 
                            variant: 'caption', 
                            fontSize: '0.7rem',
                            noWrap: true,
                            title: port.name,
                            sx: { 
                              maxWidth: 80,
                              display: 'block',
                              textOverflow: 'ellipsis',
                              color: 'rgba(0, 0, 0, 0.87)'
                            }
                          }}
                          sx={{ ml: 0.5 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, pl: 1 }}>
                  <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.65rem' }}>Outputs</Typography>
                  <List dense sx={{ py: 0, maxHeight: 120, overflowY: 'auto' }}>
                    {outputPorts.map(port => (
                      <ListItem key={port.id} sx={{ py: 0.25 }}>
                        <ListItemText 
                          primary={port.name} 
                          primaryTypographyProps={{ 
                            variant: 'caption', 
                            fontSize: '0.7rem',
                            noWrap: true,
                            title: port.name,
                            sx: { 
                              maxWidth: 80,
                              display: 'block',
                              textOverflow: 'ellipsis',
                              textAlign: 'right',
                              color: 'rgba(0, 0, 0, 0.87)'
                            }
                          }}
                          sx={{ mr: 0.5 }}
                        />
                        <Handle 
                          type="source" 
                          position={Position.Right} 
                          id={port.id}
                          isConnectable={isConnectable}
                          style={{ 
                            background: port.connectedTo ? '#4caf50' : '#9e9e9e',
                            width: 8,
                            height: 8,
                            right: -4,
                            zIndex: 1000
                          }} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(CustomNode); 