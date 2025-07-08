import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Flag, 
  Tag,
  Trash2,
  Edit3
} from "lucide-react";
import type { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";

interface KanbanAPI {
  getBoards: () => Promise<KanbanBoard[]>;
  createBoard: (board: { name: string; description?: string }) => Promise<KanbanBoard>;
  getColumns: (boardId: number) => Promise<KanbanColumn[]>;
  createColumn: (column: { name: string; boardId: number; position: number; color?: string }) => Promise<KanbanColumn>;
  getCards: (columnId: number) => Promise<KanbanCard[]>;
  createCard: (card: any) => Promise<KanbanCard>;
  updateCard: (id: number, card: any) => Promise<KanbanCard>;
  moveCard: (id: number, columnId: number, position: number) => Promise<KanbanCard>;
  deleteCard: (id: number) => Promise<void>;
}

const kanbanAPI: KanbanAPI = {
  getBoards: async () => {
    try {
      const response = await fetch("/api/kanban/boards", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch boards");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching boards:", error);
      return [];
    }
  },
  createBoard: (board) => apiRequest("POST", "/api/kanban/boards", board),
  getColumns: async (boardId) => {
    try {
      const response = await fetch(`/api/kanban/boards/${boardId}/columns`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch columns");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching columns:", error);
      return [];
    }
  },
  createColumn: (column) => apiRequest("POST", "/api/kanban/columns", column),
  getCards: (columnId) => apiRequest("GET", `/api/kanban/columns/${columnId}/cards`),
  createCard: (card) => apiRequest("POST", "/api/kanban/cards", card),
  updateCard: (id, card) => apiRequest("PUT", `/api/kanban/cards/${id}`, card),
  moveCard: (id, columnId, position) => apiRequest("PUT", `/api/kanban/cards/${id}/move`, { columnId, position }),
  deleteCard: (id) => apiRequest("DELETE", `/api/kanban/cards/${id}`),
};

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function Kanban() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumn | null>(null);
  const [boardForm, setBoardForm] = useState({ name: "", description: "" });
  const [columnForm, setColumnForm] = useState({ name: "", color: "#0073EA" });
  const [cardForm, setCardForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    tags: [],
    assignedToId: null,
    clientId: null
  });

  // Fetch boards
  const { data: boards = [], isLoading: boardsLoading, error: boardsError } = useQuery({
    queryKey: ["/api/kanban/boards"],
    queryFn: kanbanAPI.getBoards,
  });

  // Auto-select first board when boards are loaded
  useEffect(() => {
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(boards[0]);
    }
  }, [boards, selectedBoard]);

  // Fetch columns for selected board
  const { data: columns = [] } = useQuery({
    queryKey: ["/api/kanban/columns", selectedBoard?.id],
    queryFn: () => selectedBoard && selectedBoard.id ? kanbanAPI.getColumns(selectedBoard.id) : Promise.resolve([]),
    enabled: !!selectedBoard && !!selectedBoard.id,
  });

  // Fetch cards for all columns
  const { data: allCards = [] } = useQuery({
    queryKey: ["/api/kanban/cards", Array.isArray(columns) ? columns.map(c => c.id) : []],
    queryFn: async () => {
      if (!Array.isArray(columns) || columns.length === 0) return [];
      const cardsPromises = columns.map(async column => {
        try {
          const response = await fetch(`/api/kanban/columns/${column.id}/cards`, {
            credentials: "include"
          });
          if (!response.ok) return [];
          const cards = await response.json();
          return Array.isArray(cards) ? cards : [];
        } catch (error) {
          console.error(`Error fetching cards for column ${column.id}:`, error);
          return [];
        }
      });
      const cardsArrays = await Promise.all(cardsPromises);
      return cardsArrays.flat();
    },
    enabled: Array.isArray(columns) && columns.length > 0,
  });

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: kanbanAPI.createBoard,
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setSelectedBoard(newBoard);
      setIsCreateBoardOpen(false);
      setBoardForm({ name: "", description: "" });
      toast({ title: "Success", description: "Board created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create board", variant: "destructive" });
    },
  });

  // Create column mutation
  const createColumnMutation = useMutation({
    mutationFn: kanbanAPI.createColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/columns", selectedBoard?.id] });
      setIsCreateColumnOpen(false);
      setColumnForm({ name: "", color: "#0073EA" });
      toast({ title: "Success", description: "Column created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create column", variant: "destructive" });
    },
  });

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: kanbanAPI.createCard,
    onSuccess: () => {
      // Invalidate both the cards query and the specific column's cards
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/cards"] });
      setIsCreateCardOpen(false);
      setSelectedColumn(null);
      setCardForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        tags: [],
        assignedToId: null,
        clientId: null
      });
      toast({ title: "Success", description: "Card created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create card", variant: "destructive" });
    },
  });

  // Move card mutation
  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, columnId, position }: { cardId: number; columnId: number; position: number }) =>
      kanbanAPI.moveCard(cardId, columnId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/cards"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to move card", variant: "destructive" });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const cardId = parseInt(draggableId);
    const newColumnId = parseInt(destination.droppableId);
    const newPosition = destination.index;

    moveCardMutation.mutate({ cardId, columnId: newColumnId, position: newPosition });
  };

  const handleCreateBoard = () => {
    if (!boardForm.name.trim()) return;
    createBoardMutation.mutate(boardForm);
  };

  const handleCreateColumn = () => {
    if (!columnForm.name.trim() || !selectedBoard) return;
    createColumnMutation.mutate({
      ...columnForm,
      boardId: selectedBoard.id,
      position: columns.length
    });
  };

  const handleCreateCard = () => {
    if (!cardForm.title.trim() || !selectedColumn) return;
    createCardMutation.mutate({
      ...cardForm,
      columnId: selectedColumn.id,
      position: allCards.filter(card => card.columnId === selectedColumn.id).length
    });
  };

  const getCardsForColumn = (columnId: number) => {
    return allCards.filter(card => card.columnId === columnId).sort((a, b) => a.position - b.position);
  };

  if (boardsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading kanban boards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (boardsError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px] text-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading boards</h3>
            <p className="text-gray-600 mb-4">There was an issue loading your kanban boards.</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(boards) || boards.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Create your first kanban board to start organizing tasks and projects visually.
          </p>
          
          <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="board-name">Board Name</Label>
                  <Input
                    id="board-name"
                    value={boardForm.name}
                    onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                    placeholder="Enter board name"
                  />
                </div>
                <div>
                  <Label htmlFor="board-description">Description (Optional)</Label>
                  <Textarea
                    id="board-description"
                    value={boardForm.description}
                    onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                    placeholder="Enter board description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateBoardOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateBoard}
                    disabled={createBoardMutation.isPending}
                  >
                    {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          {selectedBoard && (
            <p className="text-gray-600 mt-1">{selectedBoard.name}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Select
            value={selectedBoard?.id?.toString() || ""}
            onValueChange={(value) => {
              if (value && !isNaN(parseInt(value))) {
                const board = boards.find(b => b.id === parseInt(value));
                setSelectedBoard(board || null);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a board" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(boards) && boards.map((board) => (
                <SelectItem key={board.id} value={board.id.toString()}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="board-name">Board Name</Label>
                  <Input
                    id="board-name"
                    value={boardForm.name}
                    onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                    placeholder="Enter board name"
                  />
                </div>
                <div>
                  <Label htmlFor="board-description">Description (Optional)</Label>
                  <Textarea
                    id="board-description"
                    value={boardForm.description}
                    onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                    placeholder="Enter board description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateBoardOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateBoard}
                    disabled={createBoardMutation.isPending}
                  >
                    {createBoardMutation.isPending ? "Creating..." : "Create Board"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedBoard ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {Array.isArray(columns) && columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: column.color }}
                        />
                        <CardTitle className="text-sm font-medium">{column.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {getCardsForColumn(column.id).length}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedColumn(column);
                          setIsCreateCardOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Droppable droppableId={column.id.toString()}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                            snapshot.isDraggingOver ? 'bg-gray-50' : ''
                          }`}
                        >
                          {getCardsForColumn(column.id).map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab ${
                                    snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-sm text-gray-900 flex-1">
                                      {card.title}
                                    </h4>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  {card.description && (
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                      {card.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {card.priority && (
                                        <Badge 
                                          className={`text-xs px-2 py-0.5 ${PRIORITY_COLORS[card.priority as keyof typeof PRIORITY_COLORS]}`}
                                          variant="secondary"
                                        >
                                          <Flag className="w-3 h-3 mr-1" />
                                          {card.priority}
                                        </Badge>
                                      )}
                                      {card.dueDate && (
                                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {new Date(card.dueDate).toLocaleDateString()}
                                        </Badge>
                                      )}
                                    </div>
                                    {card.assignedToId && (
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-gray-600" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {card.tags && card.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {card.tags.slice(0, 3).map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                                          <Tag className="w-2 h-2 mr-1" />
                                          {tag}
                                        </Badge>
                                      ))}
                                      {card.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          +{card.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {/* Add Column Button */}
            <div className="flex-shrink-0 w-80">
              <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
                <DialogTrigger asChild>
                  <Card className="h-fit cursor-pointer hover:bg-gray-50 transition-colors border-dashed">
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Add Column</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Column</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="column-name">Column Name</Label>
                      <Input
                        id="column-name"
                        value={columnForm.name}
                        onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                        placeholder="Enter column name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="column-color">Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="column-color"
                          type="color"
                          value={columnForm.color}
                          onChange={(e) => setColumnForm({ ...columnForm, color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={columnForm.color}
                          onChange={(e) => setColumnForm({ ...columnForm, color: e.target.value })}
                          placeholder="#0073EA"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateColumnOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateColumn}
                        disabled={createColumnMutation.isPending}
                      >
                        {createColumnMutation.isPending ? "Creating..." : "Create Column"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="flex items-center justify-center min-h-[400px] text-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a board</h3>
            <p className="text-gray-600">Choose a board from the dropdown above to get started.</p>
          </div>
        </div>
      )}

      {/* Create Card Dialog */}
      <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-title">Title</Label>
              <Input
                id="card-title"
                value={cardForm.title}
                onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                placeholder="Enter card title"
              />
            </div>
            <div>
              <Label htmlFor="card-description">Description</Label>
              <Textarea
                id="card-description"
                value={cardForm.description}
                onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                placeholder="Enter card description"
              />
            </div>
            <div>
              <Label htmlFor="card-priority">Priority</Label>
              <Select value={cardForm.priority} onValueChange={(value) => setCardForm({ ...cardForm, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="card-due-date">Due Date</Label>
              <Input
                id="card-due-date"
                type="date"
                value={cardForm.dueDate}
                onChange={(e) => setCardForm({ ...cardForm, dueDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateCardOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCard}
                disabled={createCardMutation.isPending}
              >
                {createCardMutation.isPending ? "Creating..." : "Create Card"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}