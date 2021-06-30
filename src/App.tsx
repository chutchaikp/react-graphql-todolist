import { Alert, AlertDescription, AlertIcon, AlertTitle, Badge, Box, Button, Checkbox, CloseButton, Flex, FormControl, HStack, Input, propNames, Skeleton, Stack, useToast, VStack } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons'
import { formatDistance } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';

import { useCreateTodoMutation, useDeleteTodoMutation, useGetTodosQuery, useGetTodosWithFetchMoreLazyQuery, useGetTodosWithFetchMoreQuery, useUpdateTodoMutation } from './types/graphql.v1';
import { finished } from 'stream';
import MySkeleton from './components/MySkeleton';

function App() {
  const toast = useToast()
  const iRef = useRef<any>({})
  const [invalidFields, setInvalidFields] = useState<any>({
    title: false,
  })

  const [todos, setTodos] = useState<any>([]) // ***
  const [todoCount, setTodoCount] = useState(0)

  const [removingId, setRemovingId] = useState()
  const [updatingId, setUpdatingId] = useState<any>()

  // const { data, loading, error } = useGetTodosQuery({
  //   onCompleted: (data) => {
  //     const gdata = [...data.todos || []]
  //     const gDataWithSelectProps = gdata.map((g) => {
  //       return { ...g, selected: false, }
  //     })
  //     setTodos(gDataWithSelectProps)
  //   }
  // });

  // How to implemnt fetchMore
  // const {data, loading, error} = useGetTodosWithFetchMoreQuery({
  //   variables: { limit: 2, start: todos.length === 0 ? 0 : todos.length - 1, }
  // })

  const [fetch, fetchVars] = useGetTodosWithFetchMoreLazyQuery({
    onCompleted: (data) => {
      const gdata = [...todos, ...data.todos || []]
      const gDataWithSelectProps = gdata.map((g) => {
        return { ...g, selected: false, }
      })

      setTodos(gDataWithSelectProps)
      setTodoCount(data.todosConnection?.aggregate?.count || 0)
    }
  })

  useEffect(() => {
    fetch({
      variables: { limit: 2, start: todos.length === 0 ? 0 : todos.length - 1 }
    })
  }, [])

  const [create, createVars] = useCreateTodoMutation();
  const [del, delVars] = useDeleteTodoMutation();
  const [update, updateVars] = useUpdateTodoMutation();

  const validateInvalid = (e: any) => {
    const format = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    const frm = e.target;
    let invalid = { ...invalidFields };

    invalid = {
      ...invalid, title: (frm.title.value.length > 0 ||
        frm.title.value.length > 20 ||
        format.test(frm.title.value)
        ? false : true)
    }

    // Validate length > 20 chars    
    if (frm.title.value.length > 20) {
      showToast('Exceeding the maximum allowable length', 'error')
      return true;
    }
    // Validate spectial charater    
    if (format.test(frm.title.value)) {
      showToast('Special characters not allowed', 'error')
      return true;
    }

    setInvalidFields(invalid)

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

  const showToast = (msg: string, status: string = 'success') => {
    toast({
      title: msg,
      status: 'success',
      position: 'top-right',
      isClosable: true,
      render: () => (
        <Flex direction="row"
          color="white"
          p="5px" bg={status === 'success' ? 'green.500' : 'red'} rounded="md" alignItems="center" >
          <CheckCircleIcon mx="5px" fontSize="18px" />
          <p style={{ color: 'white', marginLeft: '5px', fontSize: '18px' }}>{msg}</p>
        </Flex>
      )
    })
  }

  if (todos.length === 0 && fetchVars.loading) {
    return (<MySkeleton />)
  }

  if (fetchVars.error) {
    return (<Alert status="error">
      <AlertIcon />
      <AlertDescription>{fetchVars.error}</AlertDescription>
      <CloseButton position="absolute" right="8px" top="8px" />
    </Alert>)
  }

  return (
    <Flex align="center" direction="column" px="2rem" py="1rem" >

      <VStack spacing={5} w={{ base: "50%", sm: "90%", md: "50%" }}  >

        <form onSubmit={formSubmit} style={{ width: '99%', }} >

          <FormControl isInvalid={invalidFields.title}>
            <label>
              <HStack align="center" >
                <Input name="title" size="md" placeholder="Enter todo here" defaultValue="" ref={el => iRef.current['title'] = el} />
                <Button rounded="none" size="md" variant="outline" type="submit" >
                  {createVars.loading ? 'saving' : 'save'}
                </Button>
              </HStack>
            </label>
          </FormControl>

        </form>

        <Box boxShadow="lg" px="6" pb="4" rounded="md" bg="white" width="100%">
          <ul style={{ width: '100%', }}>
            <li> total {todoCount}</li>
            <li>
              <Flex direction="row" justify="space-between">
                <Checkbox size="lg" onChange={(e) => {
                  e.preventDefault();
                  const isChecked = e.target.checked
                  setTodos((prev: any) => {
                    const data = [...prev];
                    return data.map((t) => {
                      return { ...t, selected: isChecked, }
                    })
                  })
                }} >
                  <span>Select all</span>
                </Checkbox>

                <HStack>

                  <Button size="sm" onClick={() => {
                    // TODO remove all selected

                  }}>
                    bulk remove
                  </Button>

                  <Button size="sm" onClick={async () => {
                    showToast('Updating selected todos')
                    try {
                      todos.forEach(async (td: any) => {
                        if (!td.selected) return;
                        const result = await update({
                          variables: {
                            Todo: { finished: !td.finished },
                            id: td.id,
                          },
                        })
                        console.log(result)
                      });

                    } catch (error) {
                      debugger;

                    }

                    // update ui
                    setTodos((prev: any) => {
                      const data = [...prev]
                      const newData = data.map((x: any) => {
                        if (x.selected) {
                          return { ...x, finished: true }
                        }
                        return { ...x }
                      })
                      return newData;
                    })

                  }} > bulk archive </Button>

                </HStack>

              </Flex>


            </li>
            {todos.map((t: any) => {
              const dist = formatDistance(
                new Date(t.updatedAt),
                new Date(),
                { includeSeconds: true }
              )

              return (
                <li key={t.id}>

                  <Flex direction="row">
                    <Checkbox isChecked={t.selected ? true : false} w="30px" size="lg" mr="1rem"
                      onChange={(e) => {
                        setTodos((prev: any) => {
                          const data = [...prev]
                          const newData = data.map((x) => {
                            if (x.id === t.id) {
                              return { ...x, selected: e.target.checked }
                            }
                            return { ...x }
                          })
                          return newData;
                        })
                      }} />

                    <Flex w="100%" justify="space-between" direction={{ base: "row", sm: "column", md: "row" }}>
                      <Box flexGrow={1}>
                        <div className={t.finished ? 'title todo-finished' : 'title'}>{t.title}</div>
                        {/* <span>{dist}</span> */}
                        <Badge borderRadius="full" px="2" colorScheme="teal">
                          {dist}
                        </Badge>
                      </Box>
                      <HStack w="150px">

                        <Button size="xs" variant="outline" colorScheme="purple" onClick={async () => {

                          setUpdatingId(t.id);

                          const result = await update({
                            variables: {
                              Todo: { finished: !t.finished },
                              id: t.id
                            }
                          })
                          setTodos((prev: any) => {
                            const data = [...prev];
                            const newData = data.map((x) => {
                              if (x.id === t.id) {
                                return { ...x, finished: !x.finished }
                              }
                              return { ...x }
                            });
                            return newData;
                          })

                          setUpdatingId(-1)

                          // console.log('Updated!', result);
                          showToast(`${t.title} has been updated`)

                        }}> {updatingId === t.id ? 'archiving' : 'archive'} </Button>

                        <Button size="xs" variant="solid" colorScheme="red" onClick={async () => {
                          setRemovingId(t.id);
                          const res = await del({ variables: { id: t.id } });
                          setTodos((prev: any) => {
                            return prev.filter((t: any) => {
                              const id = res.data?.deleteTodo?.todo?.id;
                              return id !== t.id;
                            });
                          });
                          console.log(res.data?.deleteTodo?.todo?.id, 'deleted');

                        }}> {delVars.loading && removingId === t.id ? 'removing' : 'remove'} </Button>
                      </HStack>
                    </Flex>

                  </Flex>
                </li>
              )
            })}

            <li>
              {todos.length < todoCount && (
                <Button onClick={() => {
                  fetch({
                    variables: { limit: 2, start: todos.length }
                  })
                }} >
                  {fetchVars.loading ? 'Loading ...' : 'Load more ... '}
                </Button>
              )}

            </li>
          </ul>
        </Box>

      </VStack>

    </Flex>
  );
}

export default App;

