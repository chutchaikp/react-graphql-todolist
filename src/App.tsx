import { Box, Button, Checkbox, Flex, FormControl, HStack, Input, Stack, VStack } from '@chakra-ui/react';
import { formatDistance } from 'date-fns';
import React, { useRef, useState } from 'react';

import { useCreateTodoMutation, useDeleteTodoMutation, useGetTodosQuery } from './types/graphql.v1';

function App() {
  const iRef = useRef<any>({})
  const [invalidFields, setInvalidFields] = useState<any>({
    title: false,
  })

  const [todos, setTodos] = useState<any>([])
  const [removingId, setRemovingId] = useState()
  const { data, loading, error } = useGetTodosQuery({
    onCompleted: (data) => {
      const gdata = [...data.todos || []]
      const gDataWithSelectProps = gdata.map((g) => {
        return { ...g, selected: false, }
      })
      setTodos(gDataWithSelectProps)
    }
  });
  const [create, createVars] = useCreateTodoMutation();
  const [del, delVars] = useDeleteTodoMutation();

  const validateInvalid = (e: any) => {
    const frm = e.target;
    let invalid = { ...invalidFields };
    invalid = { ...invalid, title: (frm.title.value.length > 0 ? false : true) }
    setInvalidFields(invalid)

    // TODO: validate spectial charater

    const keys = Object.keys(invalid);
    const found = keys.some((s: string) => {
      return invalid[s] === true;
    });
    return found;
  }

  const formSubmit = async (e: any) => {
    e.preventDefault();

    if (validateInvalid(e)) {
      // invalid found
    } else {
      // Mutate .....
      debugger;

      const res = await create({
        variables: {
          todo: {
            title: iRef.current['title'].value,
          }
        }
      })

      setTodos((prev: any) => {
        return [{ ...res.data?.createTodo?.todo, selected: false, }, ...prev]
      })

      iRef.current['title'].value = '';

    }
  }

  if (loading) {
    return (<span>Loading ...</span>)
  }
  if (error) {
    return (<span className="error">{error}</span>)
  }

  return (
    <Flex align="center" direction="column" px="2rem" py="1rem" >

      <VStack spacing={10} w="800px" >

        <form onSubmit={formSubmit} style={{ width: '100%', }} >

          <FormControl isInvalid={invalidFields.title}>
            <label>
              <HStack align="center" >
                <Input name="title" size="sm" placeholder="Enter todo here" defaultValue="" ref={el => iRef.current['title'] = el} />
                <Button rounded="none" size="sm" variant="outline" colorScheme="blue" type="submit" >
                  {createVars.loading ? 'saving' : 'save'}
                </Button>
              </HStack>
            </label>
          </FormControl>

        </form>

        <ul style={{ width: '100%', }}>
          {todos.map((t: any) => {
            console.log(t.updatedAt)
            const dist = formatDistance(
              new Date(t.updatedAt),
              new Date(),
              { includeSeconds: true }
            )
            return (
              <li key={t.id}>
                <Flex direction="row">
                  <Checkbox w="30px" size="lg" mr="1rem" colorScheme="purple" onChange={() => { }} />
                  <Box flexGrow={1}>
                    <div className="title" >{t.title}</div>
                    <span>{dist}</span>
                    {/* <span>{new Date(t.updatedAt).toString()}</span> */}
                  </Box>
                  <HStack w="150px" >
                    <Button size="xs" variant="outline" colorScheme="purple" >archive</Button>
                    <Button size="xs" variant="solid" colorScheme="red" onClick={async () => {
                      setRemovingId(t.id)
                      const res = await del({ variables: { id: t.id } })
                      setTodos((prev: any) => {
                        return prev.filter((t: any) => {
                          const id = res.data?.deleteTodo?.todo?.id;
                          return id !== t.id
                        })
                      })
                      console.log(res.data?.deleteTodo?.todo?.id, 'deleted');

                    }} > {delVars.loading && removingId === t.id ? 'removing' : 'remove'} </Button>
                  </HStack>
                </Flex>
              </li>
            )
          })}
        </ul>

      </VStack>

    </Flex>
  );
}

export default App;
