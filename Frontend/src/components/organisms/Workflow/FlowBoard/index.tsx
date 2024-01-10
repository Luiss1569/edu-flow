import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  ReactFlowInstance,
  ReactFlowJsonObject,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import NodeTypes from "@components/atoms/Workflow/Nodes";
import EdgeTypes from "@components/atoms/Workflow/Edges";
import FlowPanel from "@components/molecules/Workflow/FlowPanel";
import FlowHeader from "@components/molecules/Workflow/FlowHeader";
import { createOrUpdateWorkflow, getWorkflow } from "@apis/workflows";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Center, Spinner, useToast } from "@chakra-ui/react";
import { IStep, IWorkflow } from "@interfaces/Workflow";
import { AxiosError } from "axios";

const convertReactFlowObject = (
  reactFlowObject: ReactFlowJsonObject
): IWorkflow["steps"] => {
  return reactFlowObject.nodes.map((node) => {
    const edge = reactFlowObject.edges.find((edge) => edge.source === node.id);
    return {
      id: node.id,
      position: node.position,
      data: node.data,
      type: node.type,
      next_step_id: edge ? edge.target : null,
    } as IStep;
  });
};

const initialNodes: Node[] = [
  {
    id: "start",
    position: { x: 0, y: 0 },
    data: {
      label: "Inicio",
      hasHandleRight: true,
      hasMenu: true,
      visible: false,
    },
    type: "circle",
    deletable: false,
  },
  {
    id: "end",
    position: { x: 100, y: 0 },
    data: { label: "Fim", hasHandleLeft: true, visible: false, name: "end" },
    type: "circle",
    deletable: false,
  },
];
const initialEdges: Edge[] = [];

const FlowBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const params = useParams<{ id?: string }>();
  const id = params?.id ?? "";
  const isEditing = !!id;

  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflow", id],
    queryFn: getWorkflow,
    enabled: isEditing,
  });

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: `Instituto ${isEditing ? "editada" : "criada"} com sucesso`,
        status: "success",
        duration: 3000,
        isClosable: true,
        variant: "left-accent",
        position: "top-right",
      });
      navigate(-1);
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      toast({
        title: `Erro ao ${isEditing ? "editar" : "criar"} instituto`,
        description: error?.response?.data?.message ?? error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        variant: "left-accent",
        position: "top-right",
      });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();

      const steps = convertReactFlowObject(flow);
      const data = {
        steps,
        viewport: flow.viewport,
      };

      mutateAsync(isEditing ? { _id: id, ...data } : data);
    }
  }, [reactFlowInstance, mutateAsync, id, isEditing]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      if (workflow) {
        const { x = 0, y = 0, zoom = 1 } = workflow.viewport;
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setViewport({ x, y, zoom });
      }
    };
    restoreFlow();
  }, [setNodes, setViewport, workflow, setEdges]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) ?? { x: 0, y: 0 };

      setNodes((nodes) => [
        ...nodes,
        {
          id: crypto.randomUUID(),
          type,
          position: position,
          data: {},
        },
      ]);
    },
    [reactFlowInstance, setNodes]
  );

  useEffect(() => {
    onRestore();
  }, [workflow, onRestore]);

  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner />
      </Center>
    );
  }

  return (
    <div
      className="reactflow-wrapper"
      ref={reactFlowWrapper}
      style={{ height: "100%" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={NodeTypes}
        edgeTypes={EdgeTypes}
        proOptions={{
          hideAttribution: true,
        }}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "default",
          labelStyle: { fill: "#fff", fontWeight: 700 },
          markerEnd: {
            type: MarkerType.Arrow,
          },
        }}
        onDrop={onDrop}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
      >
        <FlowHeader onSave={onSave} isPending={isPending} />
        <Background color="#aaa" gap={16} size={1} />
        <Controls />
        <MiniMap />
        <FlowPanel />
      </ReactFlow>
    </div>
  );
};

const FlowBoardMemo = memo(FlowBoard);
export default FlowBoardMemo;
