import { Button } from '@chakra-ui/react';
import React, { useState } from 'react'

function usePrevious(data: any) {
	const ref = React.useRef();
	React.useEffect(() => {
		ref.current = data
	}, [data])

	debugger;

	return ref.current
}

const Prev = () => {

	const [counter, setCounter] = useState(0)

	const prevCounter = usePrevious(counter)



	return (
		<div>
			<p> counter:  {counter}</p>
			<p> prev: {prevCounter} </p>
			<Button
				onClick={() => {
					setCounter((prev) => {
						return prev + 1
					})
				}}
				colorScheme="purple" size="lg" w="100px" fontSize="3rem" p="1rem"  >+</Button>

			<Button onClick={() => {

			}}>Get prev value</Button>


		</div>
	);
}
export default Prev