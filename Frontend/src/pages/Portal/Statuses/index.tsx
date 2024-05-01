import {
  Box,
  Button,
  Flex,
  Heading,
} from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BiRefresh, BiEdit } from "react-icons/bi";
import { getStatuses } from "@apis/status";
import Pagination from "@components/organisms/Pagination";
import IStatus from "@interfaces/Status";

const columns = [
  {
    key: "name",
    label: "Nome",
  },
  {
    key: "type",
    label: "Tipo",
  },
  {
    key: "actions",
    label: "Ações",
  },
];

const StatusType = {
  done: "Concluído",
  progress: "Em progresso",
  canceled: "Cancelado",
};

const Action = memo((status: IStatus) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    navigate(`/portal/status/${status._id}`);
  }, [navigate, status._id]);

  return (
    <div>
      <Button colorScheme="blue" mr={2} onClick={handleEdit} size="sm">
        <BiEdit size={20} />
      </Button>
    </div>
  );
});

const Create = memo(() => {
  const navigate = useNavigate();

  const handleCreate = useCallback(() => {
    navigate(`/portal/status`);
  }, [navigate]);

  return (
    <div>
      <Button colorScheme="blue" mr={2} onClick={handleCreate} size="sm">
        Criar Status
      </Button>
    </div>
  );
});

const Statuses: React.FC = () => {
  const [searchParams] = useSearchParams();

  const page = searchParams.get("page") ?? 1;

  const {
    data: { statuses, pagination } = {},
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["statuses", String(page)],
    queryFn: getStatuses,
  });

  const data = useMemo(() => {
    if (!statuses) return [];

    return statuses.map((status) => ({
      ...status,
      type: StatusType[status.type] ?? "Não definido",
      actions: <Action {...status} />,
    }));
  }, [statuses]);

  return (
    <Box width="100%" p="10">
      <Heading>Status</Heading>
      <Flex justifyContent="flex-end" mt="4" width="100%">
        <Button
          onClick={() => refetch()}
          mr={2}
          size="sm"
          isLoading={isFetching}
        >
          <BiRefresh size={20} />
        </Button>
        <Create />
      </Flex>
      <Flex
        justifyContent="center"
        alignItems="center"
        mt="4"
        width="100%"
        p="4"
        borderRadius="md"
        direction="column"
        bg={"bg.card"}
      >
        <Table columns={columns} data={data} />
        <Pagination pagination={pagination} isLoading={isFetching} />
      </Flex>
      {isError && (
        <Flex justifyContent="center" alignItems="center" mt="4" width="100%">
          <Heading color="red.500">Erro ao carregar dados</Heading>
        </Flex>
      )}
    </Box>
  );
};

export default Statuses;
