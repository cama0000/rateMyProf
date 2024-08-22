'use client'

import { Box, Stack, TextField, Button } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      "role": "model",
      "parts": [{text: "Hi, I'm the Rate My Professor Support assistant. How can I help you today?"}]
    }
  ])
  
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    // creates a copy of messages and adds the user model placeholder
    const updatedMessages = [
      ...messages,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: '' }] }
    ];

    // update state w/ new messages
    setMessages(updatedMessages);
    setMessage(''); // Clear the input field

    const response = fetch('api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedMessages)
    }).then(async (res) => {
      // console.log("RESULT AFTER FETCH: " + res);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }

        const text = decoder.decode(value || new Uint8Array(), { stream: true });

        // console.log("TEXT", text);
        
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);

          // console.log("LAST MESSAGE", lastMessage.parts[0].text);
          return [
            ...otherMessages,
            { ...lastMessage, parts: [{ text: lastMessage.parts[0].text + text }] },
          ];
        });

        return reader.read().then(processText);
      });
    });
  //   const [messages, setMessages] = useState([
  //     {
  //       "role": "model",
  //       "parts": [{text: "Hi, I'm the Rate My Professor Support assistant. How can i help you today?"}]
  //     }
  //   ])
    
  //   const [message, setMessage] = useState('');

  //   const sendMessage = async () => {
  //     setMessages((messages)=>[
  //     ...messages,
  //     {role: "user", parts: [{text: message}] },
  //     {role: "model", parts: [{text: ''}] }
  //   ])
    

  //   setMessage('')

  //   const response = fetch('api/chat', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify([...messages, {role: "user", parts: [{text: message}] }])
  //   }).then(async (res)=>{
  //     console.log("RESULT AFTER FETCH: " + res)
  //     const reader = res.body.getReader();
  //     const decoder = new TextDecoder();

  //     let result = '';
  //     return reader.read().then(function processText({done, value}){
  //       if(done){
  //         return result
  //       }

  //       const text = decoder.decode(value || new Uint8Array(), {stream: true})

  //       console.log("TEXT", text)

  //     setMessages((messages)=>{
  //       let lastMessage = messages[messages.length - 1]
  //       let otherMessages = messages.slice(0, messages.length - 1)

  //       console.log("LAST MESSAGE", lastMessage.parts[0].text);
  //       return [
  //         ...otherMessages,
  //         {...lastMessage, parts: lastMessage.parts[0].text + text},
  //       ]
  //     })

  //     return reader.read().then(processText)
  //   })
  // })

}
  
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
      direction="column"
      width="500px"
      height="700px"
      border="1px solid black"
      p={2}
      spacing={3}
      >
        <Stack direction="column" spacing={2} flexGrow={1} overflow={"auto"} maxHeight={'100%'}>
        {
          messages.map((message, index)=>(
            <Box 
              key={index} 
              display="flex" 
              justifyContent={message.role === "model" ? "flex-start" : "flex-end"}>

            <Box
              bgcolor={message.role === "model" ? "primary.main" : "secondary.main"}
              color="white"
              borderRadius={16}
              p={3}
            >
              {message.parts[0].text}

            </Box>
            </Box>
          ))}
        </Stack>

        <Stack
          direction="row"
          spacing={2}
        >
<TextField
  label="Message"
  fullWidth
  variant="outlined"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  sx={{
    input: { color: 'white' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'blue',
      },
      '&:hover fieldset': {
        borderColor: 'blue',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'blue',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'white',
    },
  }}
/>

          <Button variant="contained" disabled={message.trim() == ''} onClick={sendMessage}>Send</Button>

          
        </Stack>
      </Stack>
    </Box>
  );
}
