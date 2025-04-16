import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  useTheme,
  alpha,
  Paper,
  Container
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MemoryIcon from '@mui/icons-material/Memory';
import CircuitIcon from '@mui/icons-material/Memory';
import StorageFactory from '../services/StorageFactory';
import { StorageHome } from '../types/storage';

console.log('Home component file loaded');

// Circuit-Board Hintergrund-Pattern
const CircuitPattern = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        pointerEvents: 'none',
        background: `
          linear-gradient(to right, ${theme.palette.primary.main} 1px, transparent 1px) 0 0 / 50px 50px,
          linear-gradient(to bottom, ${theme.palette.primary.main} 1px, transparent 1px) 0 0 / 50px 50px
        `,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 25px 25px, ${theme.palette.primary.main} 2px, transparent 2px) 0 0 / 50px 50px`
        }
      }}
    />
  );
};

export const Home = () => {
  console.log('Home component rendering');
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [homes, setHomes] = useState<StorageHome[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newHomeName, setNewHomeName] = useState('');
  const [newHomeDescription, setNewHomeDescription] = useState('');
  const [newHomeImage, setNewHomeImage] = useState('');
  const [imageError, setImageError] = useState('');

  // Lade alle Homes beim Start
  const loadHomes = async () => {
    console.log('Starting to load homes...');
    try {
      const homeClient = StorageFactory.getHomeClient();
      console.log('Got home client, fetching all homes...');
      const loadedHomes = await homeClient.findAll();
      console.log('Loaded homes from storage:', loadedHomes);
      setHomes(loadedHomes);
      console.log('Updated homes state with:', loadedHomes);
    } catch (error) {
      console.error('Failed to load homes:', error);
    }
  };

  useEffect(() => {
    console.log('Home component mounted, initializing...');
    loadHomes();
    return () => {
      console.log('Home component unmounting');
    };
  }, []);

  // Bildverarbeitung
  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Maximale Dimensionen
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          
          // Skaliere das Bild, wenn es zu groß ist
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context nicht verfügbar'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        };
        
        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle Paste Event
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        try {
          const file = item.getAsFile();
          if (!file) {
            setImageError('Bild konnte nicht verarbeitet werden');
            return;
          }
          const base64 = await processImage(file);
          setNewHomeImage(base64);
          setImageError('');
        } catch (error) {
          console.error('Fehler beim Verarbeiten des Bildes:', error);
          setImageError('Bild konnte nicht verarbeitet werden');
        }
        break;
      }
    }
  }, [processImage]);

  const handleCreateHome = async () => {
    console.log('Creating new home with name:', newHomeName);
    try {
      // Validiere das Bild falls vorhanden
      if (newHomeImage) {
        const error = validateBase64Image(newHomeImage);
        if (error) {
          setImageError(error);
          return;
        }
      }

      const homeClient = StorageFactory.getHomeClient();
      const newHome = await homeClient.create({
        name: newHomeName,
        description: newHomeDescription,
        image: newHomeImage,
        objects: [],
        boards: []
      });

      console.log('Created new home:', newHome);
      setHomes(prevHomes => {
        console.log('Adding new home to existing homes:', prevHomes);
        return [...prevHomes, newHome];
      });
      setCreateDialogOpen(false);
      setNewHomeName('');
      setNewHomeDescription('');
      setNewHomeImage('');
      setImageError('');
    } catch (error) {
      console.error('Failed to create home:', error);
    }
  };

  const handleDeleteHome = async (homeId: string) => {
    console.log('Deleting home with id:', homeId);
    try {
      const homeClient = StorageFactory.getHomeClient();
      await homeClient.delete(homeId);
      setHomes(prevHomes => {
        console.log('Removing home from existing homes:', prevHomes);
        return prevHomes.filter(home => home.id !== homeId);
      });
    } catch (error) {
      console.error('Failed to delete home:', error);
    }
  };

  // Validiere Base64-Bild
  const validateBase64Image = (base64: string) => {
    if (!base64) return '';
    
    try {
      // Prüfe ob es ein gültiges Base64-Format ist
      if (!base64.match(/^data:image\/(png|jpeg|jpg|gif);base64,/)) {
        return 'Ungültiges Bildformat. Bitte verwenden Sie ein Base64-kodiertes Bild mit Header.';
      }
      
      // Prüfe die Größe (max 1MB)
      const base64Length = base64.length - (base64.indexOf(',') + 1);
      const size = (base64Length * 3) / 4;
      if (size > 1024 * 1024) {
        return 'Bild ist zu groß. Maximale Größe ist 1MB.';
      }

      return '';
    } catch (error) {
      return 'Ungültiges Base64-Format';
    }
  };

  console.log('Rendering home list with homes:', homes);
  return (
    <Box 
      sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CircuitPattern />
      
      {/* Content Container */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Header mit Logo-ähnlichem Design */}
        <Box 
          sx={{ 
            pt: 8,
            pb: 4,
            position: 'relative',
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent:"center", alignItems: 'center', mb: 1 }}>
              <CircuitIcon 
                sx={{ 
                  fontSize: 48, 
                  mr: 2,
                  color: theme.palette.primary.main
                }} 
              />
              <Typography 
                variant="h2" 
                sx={{ 
         
                  fontWeight: 'bold',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                shui-ta homes
              </Typography>
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: alpha(theme.palette.text.primary, 0.7),
                maxWidth: 600
              }}
            >
              Verbinden Sie Ihre IoT-Geräte und erstellen Sie intelligente Automatisierungen mit unserem visuellen Flow-Editor.
            </Typography>
          </Container>
        </Box>

        {/* Hauptinhalt */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                }
              }}
            >
              Neues Home erstellen
            </Button>
          </Box>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}>
            {homes.map((home) => (
              <Card 
                key={home.id}
                sx={{ 
                  height: '100%',
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => navigate(`/home/${home.id}`)}
                  sx={{ height: '100%' }}
                >
                  {home.image && (
                    <Box
                      sx={{
                        height: 140,
                        overflow: 'hidden',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(to bottom, transparent 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
                        }
                      }}
                    >
                      <Box
                        component="img"
                        src={home.image}
                        alt={home.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  )}
                  <CardContent
                    sx={{
                      position: 'relative',
                      background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8))',
                      color: 'white',
                      '&:last-child': {
                        paddingBottom: 2
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MemoryIcon 
                        sx={{ 
                          fontSize: 32,
                          mr: 1,
                          color: 'white'
                        }} 
                      />
                      <Typography variant="h6" sx={{ flex: 1, color: 'white' }}>
                        {home.name}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHome(home.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    {home.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {home.description}
                      </Typography>
                    )}
                    <Box 
                      sx={{ 
                        mt: 2,
                        display: 'flex',
                        gap: 1
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }}
                      >
                        {home.objects.length} Objekte
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          background: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main
                        }}
                      >
                        {home.boards.length} Boards
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
            {homes.length === 0 && (
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  gridColumn: '1 / -1'
                }}
              >
                <MemoryIcon 
                  sx={{ 
                    fontSize: 48, 
                    mb: 2,
                    color: alpha(theme.palette.text.primary, 0.2)
                  }} 
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Keine Homes vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Erstellen Sie Ihr erstes Home, um mit der Automatisierung zu beginnen.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  }}
                >
                  Neues Home erstellen
                </Button>
              </Paper>
            )}
          </Box>
        </Container>

        {/* Dialog zum Erstellen eines neuen Homes */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          PaperProps={{
            sx: {
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MemoryIcon sx={{ mr: 1 }} />
              Neues Home erstellen
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              fullWidth
              value={newHomeName}
              onChange={(e) => setNewHomeName(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Beschreibung"
              fullWidth
              multiline
              rows={4}
              value={newHomeDescription}
              onChange={(e) => setNewHomeDescription(e.target.value)}
            />
            <Box
              sx={{
                border: '2px dashed',
                borderColor: imageError ? 'error.main' : 'primary.main',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onPaste={handlePaste}
            >
              <Typography>
                {newHomeImage 
                  ? 'Bild eingefügt ✓ (Klicken Sie hier, um ein anderes Bild einzufügen)'
                  : 'Fügen Sie ein Bild mit Strg+V ein'}
              </Typography>
              {imageError && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {imageError}
                </Typography>
              )}
            </Box>
            {newHomeImage && !imageError && (
              <Box 
                sx={{ 
                  mt: 2, 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              >
                <Box
                  component="img"
                  src={newHomeImage}
                  alt="Vorschau"
                  sx={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover'
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              setNewHomeName('');
              setNewHomeDescription('');
              setNewHomeImage('');
              setImageError('');
            }}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateHome} 
              variant="contained"
              disabled={!newHomeName || !!imageError}
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }}
            >
              Erstellen
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}; 