import { Flex, Text } from "@chakra-ui/react";
import UserDetails from "@components/organisms/ActivityDetails/sections/UserDetails";
import { FileUploaded } from "@interfaces/Answer";
import { memo } from "react";
import FileItem from "../FileItem";

const RenderFieldValue = memo(
  ({
    label,
    value,
  }: {
    label: string;
    value?:
      | string
      | { name: string; email: string; matriculation: string }
      | { name: string; email: string; matriculation: string }[]
      | FileUploaded;
  }) => {
    if (!label || !value) return null;

    if (!value)
      return (
        <Flex direction={"column"}>
          <Text fontSize="sm" mr={2}>
            {label}:
          </Text>
          <Text fontSize="sm" fontWeight={"bold"}>
            Não informado
          </Text>
        </Flex>
      );

    if (typeof value === "string" && value) {
      return (
        <Flex direction={"column"}>
          <Text fontSize="sm" mr={2}>
            {label}:
          </Text>
          <Text fontSize="sm" fontWeight={"bold"}>
            {value}
          </Text>
        </Flex>
      );
    }

    if (typeof value === "object") {
      if ("mimeType" in value) {
        return (
          <Flex direction={"column"}>
            <Text fontSize="sm" mr={2} mb={2}>
              {label}:
            </Text>
            <FileItem file={value} />
          </Flex>
        );
      }

      if (Array.isArray(value)) {
        return value.map((el) => (
          <Flex direction={"column"}>
            <Text fontSize="sm" mr={2} mb={2}>
              {label}:
            </Text>
            <UserDetails user={el} />
          </Flex>
        ));
      }

      return (
        <Flex direction={"column"}>
          <Text fontSize="sm" mr={2} mb={2}>
            {label}:
          </Text>
          <UserDetails user={value} />
        </Flex>
      );
    }

    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        <Text fontSize="sm" fontWeight={"bold"}>
          {value}
        </Text>
      </Flex>
    );
  }
);

export default RenderFieldValue;
