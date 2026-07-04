'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTheme } from '@/components/theme-provider';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { UserAccount } from '@/lib/types';
import { 
  Users, 
  PlusCircle, 
  Loader2, 
  Trash2, 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon,
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const userAccountSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Super Admin', 'Store Manager', 'Staff']),
  photoUrl: z.string().optional(),
});

type UserAccountValues = z.infer<typeof userAccountSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const firestore = useFirestore();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const usersQuery = useMemo(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, loading: usersLoading } = useCollection<UserAccount>(usersQuery);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: 'Admin User', email: 'admin@roseberry.com' },
  });

  const userForm = useForm<UserAccountValues>({
    resolver: zodResolver(userAccountSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Staff',
      photoUrl: '',
    },
  });

  // --- Photo Upload Logic (Camera/File/URL) ---
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [remoteUrl, setRemoteUrl] = useState('');

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setHasCameraPermission(null);
    }
  };

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Access Denied' });
    }
  };

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      };
      img.src = dataUrl;
    });
  }

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 300;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const optimized = await optimizeImage(canvas.toDataURL('image/jpeg'));
        userForm.setValue('photoUrl', optimized);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const optimized = await optimizeImage(event.target!.result as string);
      userForm.setValue('photoUrl', optimized);
    };
    reader.readAsDataURL(file);
  };

  const handleUserSubmit = async (values: UserAccountValues) => {
    if (!firestore) return;
    setIsSavingUser(true);

    const userId = editingUser?.id || `U${Date.now()}`;
    const userRef = doc(firestore, 'users', userId);
    const userData = {
      ...values,
      id: userId,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    };

    setDoc(userRef, userData)
      .then(() => {
        toast({ title: editingUser ? 'Staff Refined' : 'Staff Added' });
        setIsAddUserOpen(false);
        setEditingUser(null);
        userForm.reset();
        setShowPassword(false);
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: editingUser ? 'update' : 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSavingUser(false));
  };

  const handleDeleteUser = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'users', id)).then(() => toast({ title: 'Staff Removed' }));
  };

  useEffect(() => {
    if (editingUser) {
      userForm.reset({
        name: editingUser.name,
        email: editingUser.email,
        password: editingUser.password || '',
        role: editingUser.role,
        photoUrl: editingUser.photoUrl || '',
      });
    } else {
      userForm.reset({ name: '', email: '', password: '', role: 'Staff', photoUrl: '' });
    }
  }, [editingUser, userForm]);

  return (
    <>
      <PageHeader title="Roseberry Operating Settings" />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8 h-12 rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="profile" className="rounded-xl">Profile</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl">Team Management</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl">Artisan Theme</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="rounded-[2.5rem] border-none shadow-xl">
            <CardHeader className="p-10">
              <CardTitle className="text-3xl font-headline">Identity Console</CardTitle>
              <CardDescription>Update your personal executive profile details.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((d) => toast({ title: 'Profile Synchronized' }))} className="space-y-8">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Legal Name</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Direct Email</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="h-12 rounded-xl px-10 shadow-lg shadow-primary/20">Commit Changes</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
            <CardHeader className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-headline flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    Team Directory
                </CardTitle>
                <CardDescription>Manage administrative access and artisan roles.</CardDescription>
              </div>
              <Button onClick={() => { setEditingUser(null); setIsAddUserOpen(true); }} className="rounded-xl h-12 px-6 shadow-xl shadow-primary/20">
                <PlusCircle className="mr-2 h-4 w-4" /> Register Staff
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow className="hover:bg-transparent bg-muted/10">
                     <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest">Artisan</TableHead>
                     <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-center">Clearance</TableHead>
                     <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {usersLoading ? (
                     <TableRow><TableCell colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                   ) : users?.map((u) => (
                     <TableRow key={u.id} className="hover:bg-muted/5 transition-colors">
                       <TableCell className="p-8">
                         <div className="flex items-center gap-4">
                           <Avatar className="h-12 w-12 border-2 border-primary/20">
                             <AvatarImage src={u.photoUrl} />
                             <AvatarFallback className="bg-stone-100 text-primary font-bold">{u.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div>
                             <p className="font-bold text-lg">{u.name}</p>
                             <p className="text-xs text-muted-foreground">{u.email}</p>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell className="p-8 text-center">
                         <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                           {u.role}
                         </Badge>
                       </TableCell>
                       <TableCell className="p-8 text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsAddUserOpen(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"><UserIcon className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="rounded-[2.5rem] border-none shadow-xl">
            <CardHeader className="p-10">
              <CardTitle className="text-3xl font-headline">Visual Craftsmanship</CardTitle>
              <CardDescription>Tailor the interface to match your artisanal environment.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
               <RadioGroup value={theme} onValueChange={(v: any) => setTheme(v)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {['light', 'dark', 'rose', 'ocean'].map((t) => (
                  <Label key={t} className="cursor-pointer">
                    <RadioGroupItem value={t} className="sr-only" />
                    <div className={cn(
                        "p-4 rounded-3xl border-4 transition-all duration-500",
                        theme === t ? "border-primary scale-105 shadow-2xl" : "border-muted hover:border-accent"
                    )}>
                        <div className={cn(
                            "h-24 w-full rounded-2xl mb-4 overflow-hidden relative",
                            t === 'light' ? 'bg-stone-100' : t === 'dark' ? 'bg-stone-900' : t === 'rose' ? 'bg-rose-900' : 'bg-cyan-900'
                        )}>
                            <div className="absolute top-2 left-2 h-4 w-12 bg-white/20 rounded-full" />
                            <div className="absolute top-8 left-2 h-2 w-20 bg-white/10 rounded-full" />
                            <div className="absolute bottom-2 right-2 h-8 w-8 bg-primary/40 rounded-lg" />
                        </div>
                        <span className="block text-center font-black uppercase text-[10px] tracking-widest">{t} Palette</span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddUserOpen} onOpenChange={(o) => { if(!o) { setIsAddUserOpen(false); stopCamera(); } }}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-muted/30 p-8 border-b">
             <DialogHeader>
                <DialogTitle className="text-3xl font-headline">{editingUser ? 'Refine Staff' : 'Register New Staff'}</DialogTitle>
                <DialogDescription>Define identity and clearance level for a team member.</DialogDescription>
             </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="p-8">
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-8">
                  <div className="flex flex-col items-center gap-6">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl">
                        <AvatarImage src={userForm.watch('photoUrl')} />
                        <AvatarFallback className="bg-stone-100 text-3xl font-black text-primary">?</AvatarFallback>
                    </Avatar>
                    
                    <Tabs defaultValue="gallery" className="w-full" onValueChange={(t) => { if(t !== 'camera') stopCamera(); }}>
                       <TabsList className="grid w-full grid-cols-4 bg-muted h-10 rounded-xl p-1">
                         <TabsTrigger value="camera" className="rounded-lg text-[9px] uppercase font-bold"><Camera className="h-3 w-3 mr-1" /> Live</TabsTrigger>
                         <TabsTrigger value="upload" className="rounded-lg text-[9px] uppercase font-bold"><Upload className="h-3 w-3 mr-1" /> File</TabsTrigger>
                         <TabsTrigger value="url" className="rounded-lg text-[9px] uppercase font-bold"><LinkIcon className="h-3 w-3 mr-1" /> URL</TabsTrigger>
                         <TabsTrigger value="gallery" className="rounded-lg text-[9px] uppercase font-bold"><ImageIcon className="h-3 w-3 mr-1" /> Reset</TabsTrigger>
                       </TabsList>
                       
                       <TabsContent value="camera" className="pt-4 space-y-4">
                          <div className="aspect-[4/3] bg-black rounded-2xl overflow-hidden relative border-2 border-dashed">
                             <video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission ? 'block' : 'hidden')} autoPlay muted playsInline />
                             {!hasCameraPermission && <div className="absolute inset-0 flex items-center justify-center"><Camera className="h-10 w-10 text-muted-foreground opacity-20" /></div>}
                          </div>
                          <div className="flex justify-center gap-2">
                             {!hasCameraPermission ? <Button type="button" variant="outline" onClick={enableCamera} className="rounded-xl">Init Camera</Button> : <Button type="button" onClick={capturePhoto} className="rounded-xl">Snap Photo</Button>}
                          </div>
                       </TabsContent>
                       
                       <TabsContent value="upload" className="pt-4">
                          <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer py-2 h-auto rounded-xl" />
                       </TabsContent>
                       
                       <TabsContent value="url" className="pt-4 flex gap-2">
                          <Input placeholder="Enter photography URL..." value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} className="h-12 rounded-xl" />
                          <Button type="button" onClick={() => { userForm.setValue('photoUrl', remoteUrl); setRemoteUrl(''); }} className="h-12 rounded-xl px-4">Apply</Button>
                       </TabsContent>

                       <TabsContent value="gallery" className="pt-4 text-center">
                          <Button type="button" variant="ghost" onClick={() => userForm.setValue('photoUrl', '')} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Clear Photography</Button>
                       </TabsContent>
                    </Tabs>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <Separator className="bg-muted/50" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={userForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground flex items-center gap-2"><UserIcon className="h-3 w-3" /> Full Name</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={userForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> Workplace Email</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={userForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground flex items-center gap-2"><Lock className="h-3 w-3" /> Security Key</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="h-12 rounded-xl pr-10" 
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide security key" : "Show security key"}
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={userForm.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Security Clearance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                           <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>
                             {['Super Admin', 'Store Manager', 'Staff'].map((r) => (
                               <SelectItem key={r} value={r}>{r}</SelectItem>
                             ))}
                           </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-6 flex gap-4">
                     <DialogClose asChild><Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                     <Button type="submit" disabled={isSavingUser} className="flex-2 px-12 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                       {isSavingUser ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                       Commit Registration
                     </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
