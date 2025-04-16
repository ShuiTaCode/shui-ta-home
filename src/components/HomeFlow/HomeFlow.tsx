import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  addEdge,
  Panel,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  IconButton, 
  Fab,
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Chip,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import MemoryIcon from '@mui/icons-material/Memory';
import { NodeType, FlowNode, BoardPort, BoardConnection } from '../../types';
import { StorageObject, StorageBoard } from '../../types/storage';
import StorageFactory from '../../services/StorageFactory';
import CustomNode from './CustomNode';
import { useParams, useNavigate } from 'react-router-dom';

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: FlowNode[] = [];

export const HomeFlow = () => {
  const { homeId } = useParams();
  const navigate = useNavigate();

  // Redirect to home if no homeId is provided
  if (!homeId) {
    console.error('No homeId provided');
    navigate('/');
    return null;
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  type CustomEdge = Edge<any>;
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge[]>([]);
  const [open, setOpen] = useState(false);
  const [nodeData, setNodeData] = useState({ 
    label: '', 
    content: '', 
    nodeType: 'sensor' as NodeType 
  });
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [logicDialogOpen, setLogicDialogOpen] = useState(false);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [boardData, setBoardData] = useState({
    label: '',
    content: ''
  });
  const [newConnectionDialogOpen, setNewConnectionDialogOpen] = useState(false);
  const [newConnection, setNewConnection] = useState<{
    input: string;
    output: string;
    logic: string;
  }>({
    input: '',
    output: '',
    logic: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'success' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Lade Home beim Komponenten-Mount
  useEffect(() => {
    console.log('Loading home with ID:', homeId);
    loadHome();
  }, [homeId]);

  // Verhindere zu häufiges Speichern mit Debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0) {
        console.log('Saving home after changes');
        saveHome();
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  useEffect(() => {
    if (selectedNode && logicDialogOpen) {
      console.log('Selected Node:', selectedNode);
      console.log('Ports:', selectedNode.data.ports);
    }
  }, [selectedNode, logicDialogOpen]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Verbindung in den Edges speichern
      setEdges((eds) => addEdge(params, eds) as Edge[]);
      
      // Verbindungsstatus in den Nodes aktualisieren
      const sourceId = params.source || undefined;
      const targetId = params.target || undefined;
      
      if (sourceId && targetId) {
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        
        if (sourceNode && targetNode) {
          setNodes((nds) => {
            return nds.map(node => {
              if (node.id === sourceId && node.data.nodeType === 'board') {
                // Erstelle oder aktualisiere Output-Port für das Board
                const existingPort = node.data.ports?.find(p => p.connectedTo === targetId);
                const ports = node.data.ports || [];
                
                if (!existingPort) {
                  const newPort: BoardPort = {
                    id: crypto.randomUUID(),
                    name: targetNode.data.label,
                    type: 'output',
                    connectedTo: targetId
                  };
                  return {
                    ...node,
                    data: { ...node.data, ports: [...ports, newPort] }
                  };
                }
              }
              if (node.id === targetId && node.data.nodeType === 'board') {
                // Erstelle oder aktualisiere Input-Port für das Board
                const existingPort = node.data.ports?.find(p => p.connectedTo === sourceId);
                const ports = node.data.ports || [];
                
                if (!existingPort) {
                  const newPort: BoardPort = {
                    id: crypto.randomUUID(),
                    name: sourceNode.data.label,
                    type: 'input',
                    connectedTo: sourceId
                  };
                  return {
                    ...node,
                    data: { ...node.data, ports: [...ports, newPort] }
                  };
                }
              }
              return node;
            });
          });
        }
      }
    },
    [setEdges, nodes, setNodes]
  );

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      // Bestimme den Typ des Nodes und wähle den entsprechenden Client
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        if (node.data.nodeType === 'board') {
          await StorageFactory.getBoardClient().delete(nodeId);
        } else {
          await StorageFactory.getObjectClient().delete(nodeId);
        }
      }

      // Lösche alle Verbindungen zu diesem Node
      setEdges(edges => edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));

      // Lösche den Node selbst
      setNodes(nodes => nodes.filter(node => node.id !== nodeId));

      // Aktualisiere die Ports in verbundenen Boards
      setNodes(nodes => nodes.map(node => {
        if (node.data.nodeType === 'board') {
          return {
            ...node,
            data: {
              ...node.data,
              ports: node.data.ports?.filter(port => 
                port.connectedTo !== nodeId
              )
            }
          };
        }
        return node;
      }));
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  }, [setNodes, setEdges, nodes]);

  const handleAddNode = async () => {
    console.log('Starting handleAddNode with data:', nodeData);
    try {
      // Erstelle das neue Node-Objekt
      const newNode: FlowNode = {
        id: crypto.randomUUID(),
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          label: nodeData.label,
          content: nodeData.content,
          nodeType: nodeData.nodeType,
          onDelete: () => handleDeleteNode(newNode.id)
        }
      };
      console.log('Created new node:', newNode);

      // Erstelle das Storage-Objekt
      const storageObject: StorageObject = {
        id: newNode.id,
        label: nodeData.label,
        content: nodeData.content,
        nodeType: nodeData.nodeType as 'sensor' | 'motor' | 'light',
        position: { x: 100, y: 100 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      console.log('Created storage object:', storageObject);

      // Speichere das Objekt im Storage
      const homeClient = StorageFactory.getHomeClient();
      const home = await homeClient.findById(homeId);
      console.log('Found home:', home);
      
      if (!home) {
        showError('Home konnte nicht gefunden werden');
        return;
      }

      // Update das Home mit dem neuen Objekt
      const { id, createdAt, updatedAt, ...updateData } = home;
      const updatePayload = {
        ...updateData,
        objects: [...home.objects, storageObject]
      };
      console.log('Update payload:', updatePayload);
      
      await homeClient.update(homeId, updatePayload);

      // Verifiziere, dass das Objekt gespeichert wurde
      const updatedHome = await homeClient.findById(homeId);
      console.log('Updated home:', updatedHome);
      
      if (!updatedHome?.objects.find(obj => obj.id === newNode.id)) {
        console.error('Object not found in updated home');
        showError('Objekt konnte nicht gespeichert werden');
        return;
      }

      // Lade die Nodes neu
      await loadHome();
      
      // Dialog schließen und State zurücksetzen
      setOpen(false);
      setNodeData({ label: '', content: '', nodeType: 'sensor' });

      // Zeige Erfolgsmeldung
      setSnackbar({
        open: true,
        message: 'Objekt wurde erfolgreich erstellt',
        severity: 'success'
      });
      console.log('Node creation completed successfully');
    } catch (error) {
      console.error('Failed to create object:', error);
      showError('Fehler beim Erstellen des Objekts: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handleAddBoard = async () => {
    try {
      const newBoard: FlowNode = {
        id: crypto.randomUUID(),
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          label: boardData.label,
          content: boardData.content,
          nodeType: 'board',
          ports: [],
          connections: [],
          onDelete: () => handleDeleteNode(newBoard.id)
        }
      };
      
      setNodes(nodes => [...nodes, newBoard]);
      setBoardDialogOpen(false);
      setBoardData({ label: '', content: '' });
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    const flowNode = node as FlowNode;
    if (flowNode.data.nodeType === 'board') {
      setSelectedNode(flowNode);
      setLogicDialogOpen(true);
    }
  };

  const handlePortClick = (port: BoardPort) => {
    console.log('Clicking port:', port);
  };

  const handleAddConnection = async () => {
    try {
      if (!selectedNode) {
        showError('Kein Board ausgewählt');
        return;
      }

      // Validiere die Eingaben
      if (!newConnection.input || !newConnection.output) {
        showError('Bitte wählen Sie Input und Output aus');
        return;
      }

      // Aktualisiere den Node-State
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode.id) {
          const connections = node.data.connections || [];
          const newBoardConnection: BoardConnection = {
            sourcePortId: newConnection.input,
            targetPortId: newConnection.output,
            inputs: [newConnection.input],
            outputs: [newConnection.output],
            logic: newConnection.logic
          };
          const updatedNode: FlowNode = {
            ...node,
            data: {
              ...node.data,
              connections: [...connections, newBoardConnection]
            }
          };
          setSelectedNode(updatedNode);
          return updatedNode;
        }
        return node;
      });

      setNodes(updatedNodes);

      // Speichere die Änderungen sofort
      await saveHome();

      // Schließe den Dialog und setze die Werte zurück
      setNewConnectionDialogOpen(false);
      setNewConnection({ input: '', output: '', logic: '' });

      // Zeige Erfolgsmeldung
      setSnackbar({
        open: true,
        message: 'Verbindung wurde erfolgreich erstellt',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to add connection:', error);
      showError('Fehler beim Erstellen der Verbindung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const showError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Lade das Home und seine Nodes
  const loadHome = async () => {
    try {
      const homeClient = StorageFactory.getHomeClient();
      const home = await homeClient.findById(homeId);
      
      if (!home) {
        showError('Home konnte nicht gefunden werden');
        navigate('/');
        return;
      }

      const objectNodes: FlowNode[] = home.objects.map(obj => ({
        id: obj.id,
        type: 'custom',
        position: obj.position,
        data: {
          label: obj.label,
          content: obj.content,
          nodeType: obj.nodeType,
          onDelete: () => handleDeleteNode(obj.id)
        }
      }));

      const boardNodes: FlowNode[] = home.boards.map(board => ({
        id: board.id,
        type: 'custom',
        position: board.position,
        data: {
          label: board.label,
          content: board.content,
          nodeType: 'board',
          ports: board.ports,
          connections: board.connections,
          onDelete: () => handleDeleteNode(board.id)
        }
      }));

      const newEdges: CustomEdge[] = [];
      home.boards.forEach(board => {
        board.ports?.forEach(port => {
          if (port.connectedTo) {
            const edge: CustomEdge = {
              id: `${board.id}-${port.connectedTo}`,
              source: port.type === 'output' ? board.id : port.connectedTo,
              target: port.type === 'input' ? board.id : port.connectedTo,
              type: 'default'
            };
            newEdges.push(edge);
          }
        });
      });

      setNodes([...objectNodes, ...boardNodes]);
      setEdges(newEdges);
    } catch (error) {
      console.error('Failed to load home:', error);
      showError('Fehler beim Laden des Homes: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  // Speichere Änderungen am Home
  const saveHome = async () => {
    try {
      const homeClient = StorageFactory.getHomeClient();
      const home = await homeClient.findById(homeId);
      
      if (!home) {
        showError('Home konnte nicht gefunden werden');
        return;
      }

      const objects: StorageObject[] = nodes
        .filter(node => node.data.nodeType !== 'board')
        .map(node => ({
          id: node.id,
          label: node.data.label,
          content: node.data.content,
          nodeType: node.data.nodeType as 'sensor' | 'motor' | 'light',
          position: node.position,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));

      const boards: StorageBoard[] = nodes
        .filter(node => node.data.nodeType === 'board')
        .map(node => ({
          id: node.id,
          label: node.data.label,
          content: node.data.content,
          position: node.position,
          ports: node.data.ports || [],
          connections: node.data.connections || [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));

      // Behalte die bestehenden Home-Eigenschaften bei
      const { id, createdAt, updatedAt, ...updateData } = home;
      await homeClient.update(homeId, {
        ...updateData,
        objects,
        boards
      });

      // Verifiziere das Speichern
      const verifiedHome = await homeClient.findById(homeId);
      if (!verifiedHome) {
        showError('Fehler beim Speichern: Home konnte nicht verifiziert werden');
        return;
      }

      // Überprüfe, ob alle Boards mit ihren Verbindungen gespeichert wurden
      const missingBoards = boards.filter(board => {
        const savedBoard = verifiedHome.boards.find(b => b.id === board.id);
        if (!savedBoard) return true;
        
        // Überprüfe, ob alle Verbindungen gespeichert wurden
        const savedConnections = savedBoard.connections?.length || 0;
        const expectedConnections = board.connections?.length || 0;
        return savedConnections !== expectedConnections;
      });

      if (missingBoards.length > 0) {
        console.error('Einige Boards wurden nicht korrekt gespeichert:', missingBoards);
        showError('Einige Board-Verbindungen konnten nicht gespeichert werden');
      }
    } catch (error) {
      console.error('Failed to save home:', error);
      showError('Fehler beim Speichern des Homes: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box sx={{ height: '100vh', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
        <IconButton onClick={handleBack} size="large">
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="bottom-right">
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Fab color="primary" onClick={() => setOpen(true)}>
              <AddIcon />
            </Fab>
            <Fab color="secondary" onClick={() => setBoardDialogOpen(true)}>
              <MemoryIcon />
            </Fab>
          </Box>
        </Panel>
      </ReactFlow>

      {/* Dialog zum Erstellen eines neuen Objekts */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Neues Objekt erstellen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={nodeData.label}
            onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Typ</InputLabel>
            <Select
              value={nodeData.nodeType}
              label="Typ"
              onChange={(e) => setNodeData({ ...nodeData, nodeType: e.target.value as NodeType })}
            >
              <MenuItem value="sensor">Sensor</MenuItem>
              <MenuItem value="motor">Motor</MenuItem>
              <MenuItem value="light">Licht</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Beschreibung"
            fullWidth
            multiline
            rows={4}
            value={nodeData.content}
            onChange={(e) => setNodeData({ ...nodeData, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button onClick={handleAddNode} variant="contained">Erstellen</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zum Erstellen eines Boards */}
      <Dialog open={boardDialogOpen} onClose={() => setBoardDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Neues Board erstellen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={boardData.label}
            onChange={(e) => setBoardData({ ...boardData, label: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Beschreibung"
            fullWidth
            multiline
            rows={2}
            value={boardData.content}
            onChange={(e) => setBoardData({ ...boardData, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBoardDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleAddBoard} variant="contained">Erstellen</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zum Bearbeiten der Logik */}
      <Dialog open={logicDialogOpen} onClose={() => setLogicDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Board Verbindungen
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Box>
              {/* Übersicht der verfügbaren Ports */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Verfügbare Ports
                </Typography>
                <Grid container spacing={2}>
                  <Grid sx={{ gridColumn: 'span 6' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Inputs ({selectedNode.data.ports?.filter(p => p.type === 'input').length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedNode.data.ports?.filter(p => p.type === 'input').map(port => (
                        <Chip
                          key={port.id}
                          label={port.name}
                          color={port.connectedTo ? "primary" : "default"}
                          variant={port.connectedTo ? "filled" : "outlined"}
                          size="small"
                          onClick={() => handlePortClick(port)}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid sx={{ gridColumn: 'span 6' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Outputs ({selectedNode.data.ports?.filter(p => p.type === 'output').length || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedNode.data.ports?.filter(p => p.type === 'output').map(port => (
                        <Chip
                          key={port.id}
                          label={port.name}
                          color={port.connectedTo ? "primary" : "default"}
                          variant={port.connectedTo ? "filled" : "outlined"}
                          size="small"
                          onClick={() => handlePortClick(port)}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Aktive Verbindungen */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Aktive Verbindungen
                  <Chip 
                    label={selectedNode.data.connections?.length || 0} 
                    size="small" 
                    color="primary"
                  />
                </Typography>
                
                {/* Tabelle für Verbindungen */}
                <Box sx={{ mb: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mb: 2 }}
                    onClick={() => setNewConnectionDialogOpen(true)}
                  >
                    Neue Verbindung erstellen
                  </Button>
                  
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Input(s)</TableCell>
                          <TableCell>Output(s)</TableCell>
                          <TableCell>Logik</TableCell>
                          <TableCell>Aktionen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedNode.data.connections?.map((connection, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {connection.inputs.map(inputId => {
                                const port = selectedNode.data.ports?.find(p => p.id === inputId);
                                return (
                                  <Chip 
                                    key={inputId}
                                    label={port?.name || 'Unbekannt'}
                                    size="small"
                                    sx={{ m: 0.5 }}
                                  />
                                );
                              })}
                            </TableCell>
                            <TableCell>
                              {connection.outputs.map(outputId => {
                                const port = selectedNode.data.ports?.find(p => p.id === outputId);
                                return (
                                  <Chip 
                                    key={outputId}
                                    label={port?.name || 'Unbekannt'}
                                    size="small"
                                    sx={{ m: 0.5 }}
                                  />
                                );
                              })}
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                value={connection.logic || ''}
                                onChange={(e) => {
                                  const updatedNodes = nodes.map(node => {
                                    if (node.id === selectedNode.id) {
                                      const newConnections = [...(node.data.connections || [])];
                                      newConnections[index] = {
                                        ...newConnections[index],
                                        logic: e.target.value
                                      };
                                      return {
                                        ...node,
                                        data: {
                                          ...node.data,
                                          connections: newConnections
                                        }
                                      };
                                    }
                                    return node;
                                  });
                                  setNodes(updatedNodes);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  const updatedNodes = nodes.map(node => {
                                    if (node.id === selectedNode.id) {
                                      const newConnections = node.data.connections?.filter((_, i) => i !== index);
                                      return {
                                        ...node,
                                        data: {
                                          ...node.data,
                                          connections: newConnections
                                        }
                                      };
                                    }
                                    return node;
                                  });
                                  setNodes(updatedNodes);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!selectedNode.data.connections || selectedNode.data.connections.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body2" color="text.secondary">
                                Keine Verbindungen vorhanden. Klicken Sie auf "Neue Verbindung erstellen" um zu beginnen.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogicDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog zum Erstellen einer neuen Verbindung */}
      <Dialog 
        open={newConnectionDialogOpen} 
        onClose={() => setNewConnectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neue Verbindung erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Input auswählen</InputLabel>
              <Select
                value={newConnection.input}
                label="Input auswählen"
                onChange={(e) => setNewConnection(prev => ({
                  ...prev,
                  input: e.target.value
                }))}
              >
                {selectedNode?.data.ports?.filter(p => p.type === 'input').map(port => (
                  <MenuItem key={port.id} value={port.id}>
                    {port.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <ArrowDownwardIcon color="action" />
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Output auswählen</InputLabel>
              <Select
                value={newConnection.output}
                label="Output auswählen"
                onChange={(e) => setNewConnection(prev => ({
                  ...prev,
                  output: e.target.value
                }))}
              >
                {selectedNode?.data.ports?.filter(p => p.type === 'output').map(port => (
                  <MenuItem key={port.id} value={port.id}>
                    {port.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Logik"
              placeholder="Beispiel: wenn tür auf licht dimm 0 255 3000ms"
              value={newConnection.logic}
              onChange={(e) => setNewConnection(prev => ({ ...prev, logic: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConnectionDialogOpen(false)}>Abbrechen</Button>
          <Button 
            onClick={handleAddConnection}
            variant="contained"
            disabled={!newConnection.input || !newConnection.output}
          >
            Verbindung erstellen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 