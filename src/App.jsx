import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

const API_KEY = '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';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';


export default function Component() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([
    { role: 'system', content: 'Vous êtes un assistant IA utile et amical.' }
  ]);
  const chatContainerRef = useRef(null);

  {/* bottom scroll */}
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [responses]);

  {/* cmd+enter */}
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault(); // Empêcher le retour à la ligne
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  {/* cmd+b */}
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault(); // Empêcher le retour à la ligne
        const form = document.querySelector('form');
        if (form) {
          const message = form.elements.message.value;
              if (message) {
      console.log(message);
    }
          form.elements.message.value = ''; // Vider le textarea
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  

  const handleMenuClick = () => {
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newHistory = [...conversationHistory, { role: 'user', content: message }];
    setConversationHistory(newHistory);
    setResponses([...responses, { role: 'user', content: message }]);
    setMessage('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemma-7b-it',
          messages: newHistory,
          temperature: 0.7,
          stream: true
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiMessage = '';
      let messageBuffer = '';

      setResponses((prev) => [...prev, { role: 'ai', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        messageBuffer += decoder.decode(value, { stream: true });

        const lines = messageBuffer.split('\n');
        messageBuffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line.replace(/^data: /, ''));
            const delta = data.choices[0].delta.content || '';
            aiMessage += delta;

            setResponses((prev) => {
              const updatedResponses = [...prev];
              updatedResponses[updatedResponses.length - 1].content = aiMessage;
              return updatedResponses;
            });
          }
        }
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };


  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="grid h-screen w-full">
        <div className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <Button variant="outline" size="sm" className="gap-1.5 text-sm" onClick={handleMenuClick}>
              <MenuIcon className="size-4" />
            </Button>
            <h1 className="text-xl font-semibold p-3">Ai Chat By Tixeo</h1>
            <Button variant="outline" size="sm" className="ml-auto gap-1.5 text-sm">
              Login
            </Button>
            <Button size="sm" className="gap-1.5 text-sm">
              Register
            </Button>
          </header>


          {/* CommandBar */}
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="- Hier -">
                <CommandItem>Node JS Server to index.html</CommandItem>
              </CommandGroup>
              <CommandGroup heading="- 7 jours précédents -">
                <CommandItem>Create README for github</CommandItem>
                <CommandItem>Error in JSON File</CommandItem>
                <CommandItem>SQL Request</CommandItem>
                <CommandItem>Creation of your CV</CommandItem>
                <CommandItem>Create your first Website</CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>


        <main className="max-h-screen h-[57px] grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">{/* md:grid-cols-2 lg:grid-cols-3 */}

          <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2">
            <Badge variant="outline" className="absolute left-3 top-3 z-50 bg-muted/50">
              Output
            </Badge>
            <div className="flex-1 space-y-3 overflow-auto pb-15 custom-scrollbar" ref={chatContainerRef}>
              {responses.map((res, index) => (
                res.role === 'user' ? (
                  <MyChats key={index} prompt={res.content} />
                ) : (
                  <AiChats key={index} prompt={res.content} model="Gemma-7b-it" />
                )
              ))}
            </div>
            <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring" x-chunk="dashboard-03-chunk-1">
              <Label htmlFor="message" className="sr-only">
                Message
              </Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0" />
              <div className="flex items-center p-3 pt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MicIcon className="size-4" />
                        <span className="sr-only">Use Microphone</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Use Microphone</TooltipContent>
                  </Tooltip>
                  <Button type="submit" size="sm" className="ml-auto gap-1.5">
                    Send Message
                    <CornerDownLeftIcon className="size-3.5" />
                  </Button>
                </TooltipProvider>
              </div>
            </form>

          </div>
          <div className="relative hidden flex-col items-start gap-6 md:flex" x-chunk="dashboard-03-chunk-0">
            <form className="grid w-full items-start gap-6">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">Settings</legend>
                <div className="grid gap-3">
                  <Label htmlFor="model">Model</Label>
                  <Select>
                    <SelectTrigger id="model" className="items-start [&_[data-description]]:hidden">
                      <SelectValue value="gemma" placeholder="Gemma-7b-it" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemma">
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <div className="grid gap-0.5">
                            <p>
                              <span className="font-medium text-foreground">Gemma-7b-it</span>
                            </p>
                            <p className="text-xs" data-description>
                              Our fastest model for general use cases.
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="mixtral">
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <div className="grid gap-0.5">
                            <p>
                              <span className="font-medium text-foreground">Mixtral-8x7b</span>
                            </p>
                            <p className="text-xs" data-description>
                              Performance and speed for efficiency.
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="llama">
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <div className="grid gap-0.5">
                            <p>
                              <span className="font-medium text-foreground">Llama3-70b</span>
                            </p>
                            <p className="text-xs" data-description>
                              The most powerful model for complex computations.
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input id="temperature" type="number" placeholder="0.4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="top-p">Top P</Label>
                    <Input id="top-p" type="number" placeholder="0.7" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="top-k">Top K</Label>
                    <Input id="top-k" type="number" placeholder="0.0" />
                  </div>
                </div>
              </fieldset>
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">Messages</legend>
                <div className="grid gap-3">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" placeholder="You are a..." className="min-h-[9.5rem]" />
                </div>
              </fieldset>
            </form>
          </div>
        </main>
      </div>
    </div>
    </ThemeProvider>
  )
}



function MyChats({ prompt }) {
  return (
    <div className="w-full min-h-0 flex justify-end text-sm">
      <div className="max-w-[500px] relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-2 inline-block">
        <p className='break-words'>{prompt}</p>
      </div>
    </div>
  );
}

function AiChats({ prompt, model }) {
  return (
    <div className="w-full min-h-0 flex justify-start">
      <div className="max-w-[800px] relative overflow-hidden rounded-lg border bg-muted/50 focus-within:ring-1 focus-within:ring-ring p-2 inline-block">
        <div className='relative overflow-hidden space-y-2.5'>
          <div className='flex items-center space-x-3'>
            <CodeModel/>
            <p className='text-base break-words'>{model}</p>
          </div>
          <p className='text-sm break-words'>{prompt}</p>
        </div>
      </div>
    </div>
  );
}

function CodeModel(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 2.5L5.5 6L2 10M7 11.5H12.5" stroke="#F8F9FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

  )
}

function CornerDownLeftIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 10 4 15 9 20" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  )
}

function MicIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function MenuIcon(props) {
  return (
<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>

  )
}