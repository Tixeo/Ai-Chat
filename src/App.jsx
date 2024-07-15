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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { AlignCenter, AlignJustify } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { Toaster, toast } from 'sonner'
import { rule } from 'postcss';
import ReactMarkdown from 'react-markdown';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"



export default function Component() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([
    { role: 'system', content: 'Vous êtes un assistant IA utile et amical.' }
  ]);
  const chatContainerRef = useRef(null);
  const [email, setEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [checkCodeMessage, setCheckCodeMessage] = useState('');
  const [otpValue, setOtpValue] = useState('')
  const [userId, setUserId] = useState(null);
  const [loginIsOpen, setLoginIsOpen] = useState(false);
  const [firstLetter, setFirstLetter] = useState(null);

  const openLoginDialog = () => setLoginIsOpen(true);
  const closeLoginDialog = () => setLoginIsOpen(false);

  {/* is login id ? */}
  useEffect(() => {
    firstLetterEmail(localStorage.getItem('email'))
    const id = localStorage.getItem('id');
    if (id) {
      setUserId(id);
    }
  }, []);

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
      if (event.metaKey && event.key === 'b') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function firstLetterEmail(email) {
    setFirstLetter(email.charAt(0).toUpperCase())
    return firstLetter;
  }


  
  {/* openHistory */}
  const handleMenuClick = () => {
    setOpen(true);
  };

  {/* sendMessage */}
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (message.trim() === '') {
      return;
    }
    
    const userMessage = { role: 'user', content: message };
    const newResponses = [...responses, userMessage];
    setResponses(newResponses);
    setMessage('');

      try {
        const response = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: newResponses }),
        });
  
        if (response.ok) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let result = '';
  
          setResponses((prevResponses) => [
            ...prevResponses,
            { role: 'assistant', content: '' },
          ]);
  
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
  
            // Traitement des données en flux
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.trim() !== '') {
                const json = line.replace(/^data: /, '');
                try {
                  const parsed = JSON.parse(json);
                  const content = parsed.choices[0].delta.content;
                  if (content) {
                    result += content;
                    setResponses((prevResponses) => {
                      const lastResponseIndex = prevResponses.length - 1;
                      const updatedResponses = [...prevResponses];
                      updatedResponses[lastResponseIndex] = {
                        ...updatedResponses[lastResponseIndex],
                        content: result,
                      };
                      return updatedResponses;
                    });
                  }
                } catch (e) {
                  console.error('Parsing error:', e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
  };

  {/* send email */}
  const handleEmailSender = async () => {
    if (!email) {
      setEmailMessage(`There is no email`);
      toast.error(`There is no email`)
    } else if (email.includes('@') && email.includes('.')) {
      setEmailMessage(`Code send at: ${email}, check your spam inbox!`);
      toast.success(`Code send at: ${email}, check your spam inbox!`)
      try {
        const response = await fetch('http://localhost:3001/api/email-sender', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        
        if (response.ok) {
          console.log('Data send');
        } else {
          console.error('Erreur lors de l\'envoi des données');
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    } else {
      setEmailMessage(`Not valid email: ${email}`);
      toast.error(`Not valid email: ${email}`)
    }
  };
  const handleEmailInputChange = (event) => {
    setEmail(event.target.value);
  };

  {/* check email */}
  const handleEmailChecker = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/email-checker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otpValue })
      });
      
      if (response.status === 200) {
        const data = await response.json();
        const id = data.id;
        localStorage.setItem('id', id)
        localStorage.setItem('email', email)
        setUserId(id);
        setCheckCodeMessage(`You're connected!`);
        toast.success(`You're connected!`)
        firstLetterEmail(email)
        closeLoginDialog();
        setCheckCodeMessage('')
        setEmailMessage('')
      } else {
        setCheckCodeMessage(`Not correct`);
        toast.error(`The code is not correct`)
      }
    } catch (error) {
      setCheckCodeMessage(`Error`);
      toast.error(`Error`)
    }
  };
  {/* logout */}
  const handleLogout = () => {
    localStorage.removeItem('id');
    setUserId(null);
    toast.success('You have been succefuly logout')
    setCheckCodeMessage('')
    setEmailMessage('')
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="grid h-screen w-full">
        <div className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <Sheet key='left'>
              <SheetTrigger>
                {/*onClick={handleMenuClick}*/}
                <Button variant="outline" size="sm" className="gap-1.5 text-sm" >
                  <MenuIcon className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side='left'>
                <SheetHeader>
                  <SheetTitle>History</SheetTitle>
                  <SheetDescription>It doesn't work for maintenance</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-semibold p-3">Ai Chat By Tixeo</h1>
            {userId ? (
              <DropdownMenu>
              <DropdownMenuTrigger className="ml-auto">
                <Avatar>
                  <AvatarFallback>{firstLetter}</AvatarFallback>
                </Avatar>   
            </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>         
            ) : (
            <Dialog open={loginIsOpen} onOpenChange={setLoginIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-auto">Login</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Login</DialogTitle>
                  <DialogDescription>
                    Login to the plateforme to save your chats!
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input id="email" value={email} type="email" placeholder="name@example.com" onChange={handleEmailInputChange} disabled={emailMessage.startsWith('Code send at:')}/>
                  </div>
                </div>
                {(emailMessage == 'There is no email' || emailMessage.startsWith('Not valid email:') || emailMessage == '') && <Button type="button" onClick={handleEmailSender}>Verify</Button>}
                {/*{emailMessage && <DialogDescription>{emailMessage}</DialogDescription>}*/}
                {emailMessage.startsWith('Code send at:') && <div className="flex items-center justify-center flex-col gap-5">
                  <InputOTP maxLength={6} onChange={(otpValue) => setOtpValue(otpValue)} value={otpValue}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {/*{checkCodeMessage && <DialogDescription>{checkCodeMessage}</DialogDescription>}*/}
                  <Button className="w-full" onClick={handleEmailChecker}>Continue</Button>
                </div>}
                {/*<DialogFooter className="sm:justify-start">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Close</Button>
                  </DialogClose>
                </DialogFooter>*/}
              </DialogContent>
            </Dialog>)}
            {/*<Button size="sm" className="gap-1.5 text-sm">
              Register
            </Button>*/}
          </header>


          {/* CommandBar */}
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a search..." />
            <CommandList className="custom-scrollbar">
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

          <Toaster
            toastOptions={{
              classNames: {
                toast: 'group toast bg-background text-foreground border shadow-lg',
                title: 'text-white-400',
                description: 'text-muted-foreground',
                actionButton: 'bg-primary text-primary-foreground',
                cancelButton: 'bg-primary text-primary-foreground'
              },
            }} />
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
            <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
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
                  <Input id="temperature" type="number" placeholder="0.7" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="top-p">Top P</Label>
                  <Input id="top-p" type="number" placeholder="0.7" />
                </div>
                {/*<div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="top-p">Top P</Label>
                    <Input id="top-p" type="number" placeholder="0.7" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="top-k">Top K</Label>
                    <Input id="top-k" type="number" placeholder="0.0" />
                  </div>
                </div>*/}
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
        <ReactMarkdown className='break-words'>{prompt}</ReactMarkdown>
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
          <ReactMarkdown className=' text-sm break-words'>{prompt}</ReactMarkdown>
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

function CopyIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
  )
}