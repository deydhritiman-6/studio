'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ACCESS_RIGHTS = [
  { id: 'view_dashboard', label: 'View Dashboard' },
  { id: 'manage_customers', label: 'Manage Customers' },
  { id: 'manage_orders', label: 'Manage Orders' },
  { id: 'manage_inventory', label: 'Manage Inventory' },
  { id: 'manage_products', label: 'Manage Products' },
  { id: 'manage_recipes', label: 'Manage Recipes' },
  { id: 'manage_team', label: 'Manage Team' },
  { id: 'financial_analytics', label: 'Financial Analytics' },
  { id: 'ai_insights', label: 'AI Insights' },
];

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
  
  const [activeMatrixUser, setActiveMatrixUser] = useState<UserAccount | null>(null);
  const [isSyncingMatrix, setIsSyncingMatrix] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [itemToDelete, setItemToDelete] = useState<UserAccount | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (activeMatrixUser) {
      setSelectedPermissions(activeMatrixUser.permissions || []);
    } else {
      setSelectedPermissions([]);
    }
  }, [activeMatrixUser]);

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
      permissions: editingUser?.permissions || [],
    };

    setDoc(userRef, userData)
      .then(() => {
        toast({ title: editingUser ? 'Artisan Refined' : 'Artisan Registered' });
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

  const handleRoleChange = (userId: string, newRole: UserAccount['role']) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDoc(userRef, { role: newRole })
      .then(() => {
        toast({ title: 'Clearance Updated' });
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: newRole },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleSyncMatrix = () => {
    if (!firestore || !activeMatrixUser) return;
    setIsSyncingMatrix(true);

    const userRef = doc(firestore, 'users', activeMatrixUser.id);
    updateDoc(userRef, { permissions: selectedPermissions })
      .then(() => {
        toast({ title: 'Matrix Synchronized', description: `Access rights updated for ${activeMatrixUser.name}.` });
      })
      .catch((err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { permissions: selectedPermissions },
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSyncingMatrix(false));
  };

  const confirmDeleteUser = async () => {
    if (!firestore || !itemToDelete) return;
    setIsDeleting(true);
    deleteDoc(doc(firestore, 'users', itemToDelete.id)).then(() => {
      toast({ title: 'Staff Removed' });
      if (activeMatrixUser?.id === itemToDelete.id) setActiveMatrixUser(null);
      setItemToDelete(null);
      setDeleteInput('');
    }).finally(() => setIsDeleting(false));
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

        <TabsContent value="users" className="space-y-8">
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
                     <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-center">Clearance Role</TableHead>
                     <TableHead className="p-8 uppercase text-[10px] font-black tracking-widest text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {usersLoading ? (
                     <TableRow><TableCell colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                   ) : users?.map((u) => (
                     <TableRow 
                        key={u.id} 
                        className={cn(
                            "hover:bg-muted/5 transition-colors cursor-pointer group",
                            activeMatrixUser?.id === u.id && "bg-primary/5"
                        )}
                        onClick={() => setActiveMatrixUser(u)}
                     >
                       <TableCell className="p-8">
                         <div className="flex items-center gap-4">
                           <Avatar className="h-12 w-12 border-2 border-primary/20">
                             <AvatarImage src={u.photoUrl} />
                             <AvatarFallback className="bg-stone-100 text-primary font-bold">{u.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div>
                             <p className="font-bold text-lg">{u.name}</p>
                             <div className="flex items-center gap-2">
                               <p className="text-xs text-muted-foreground">{u.email}</p>
                               <Separator orientation="vertical" className="h-3" />
                               <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{u.permissions?.length || 0} Rights Granted</span>
                             </div>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell className="p-8 text-center" onClick={(e) => e.stopPropagation()}>
                         <Select 
                           value={u.role} 
                           onValueChange={(val: any) => handleRoleChange(u.id, val)}
                         >
                            <SelectTrigger className="w-[180px] mx-auto h-10 rounded-full border-2 bg-background font-bold text-[10px] uppercase tracking-widest focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Super Admin" className="text-[10px] font-bold uppercase">Super Admin</SelectItem>
                              <SelectItem value="Store Manager" className="text-[10px] font-bold uppercase">Store Manager</SelectItem>
                              <SelectItem value="Staff" className="text-[10px] font-bold uppercase">Kitchen Staff</SelectItem>
                            </SelectContent>
                         </Select>
                       </TableCell>
                       <TableCell className="p-8 text-right" onClick={(e) => e.stopPropagation()}>
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => setActiveMatrixUser(u)} className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                               <Key className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setIsAddUserOpen(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"><UserIcon className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => setItemToDelete(u)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className={cn(
                "lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl transition-all duration-700",
                activeMatrixUser ? "opacity-100 translate-y-0" : "opacity-40 pointer-events-none grayscale"
            )}>
              <CardHeader className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b">
                 <div className="space-y-1">
                    <CardTitle className="text-3xl font-headline flex items-center gap-3">
                        <Key className="h-8 w-8 text-primary" />
                        Artisan Access Matrix
                    </CardTitle>
                    <CardDescription>Define granular operational rights for the selected staff member.</CardDescription>
                 </div>
                 {activeMatrixUser && (
                     <div className="flex items-center gap-3 bg-muted p-2 rounded-2xl">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={activeMatrixUser.photoUrl} />
                            <AvatarFallback>{activeMatrixUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="pr-4">
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-muted-foreground">Configuring</p>
                            <p className="text-sm font-bold leading-none">{activeMatrixUser.name}</p>
                        </div>
                     </div>
                 )}
              </CardHeader>
              <CardContent className="p-10">
                {!activeMatrixUser ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                            <UserIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground italic">Select an artisan from the directory to configure their access matrix.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {ACCESS_RIGHTS.map((right) => (
                                <div key={right.id} className="flex items-center space-x-3 bg-muted/30 p-4 rounded-2xl border border-muted hover:border-primary/30 transition-all group cursor-pointer" onClick={() => {
                                    setSelectedPermissions(prev => 
                                        prev.includes(right.id) ? prev.filter(p => p !== right.id) : [...prev, right.id]
                                    );
                                }}>
                                    <Checkbox 
                                        id={`matrix-${right.id}`}
                                        checked={selectedPermissions.includes(right.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedPermissions(prev => 
                                                checked ? [...prev, right.id] : prev.filter(p => p !== right.id)
                                            );
                                        }}
                                        className="h-5 w-5 border-2"
                                    />
                                    <label htmlFor={`matrix-${right.id}`} className="text-xs font-bold text-stone-600 group-hover:text-primary cursor-pointer uppercase tracking-tight flex-1">
                                        {right.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-6 border-t">
                            <Button 
                                onClick={handleSyncMatrix} 
                                disabled={isSyncingMatrix}
                                className="rounded-2xl h-14 px-12 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20"
                            >
                                {isSyncingMatrix ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                Synchronize Access Matrix
                            </Button>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-2 border-dashed bg-muted/20">
                <CardHeader className="p-8">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Access Policy Overview
                </CardTitle>
                <CardDescription>Guidelines for assigning artisan clearance levels.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                {[
                    { 
                    role: 'Super Admin', 
                    desc: 'Full system control, financial analytics, and team governance.', 
                    color: 'text-primary',
                    icon: ShieldCheck 
                    },
                    { 
                    role: 'Store Manager', 
                    desc: 'Inventory oversight, distributor management, and shop operations.', 
                    color: 'text-accent',
                    icon: AlertCircle 
                    },
                    { 
                    role: 'Kitchen Staff', 
                    desc: 'Production scheduling, recipe access, and manufacturing logs.', 
                    color: 'text-orange-500',
                    icon: CheckCircle2 
                    },
                ].map((policy) => (
                    <div key={policy.role} className="space-y-2 p-6 rounded-2xl bg-background shadow-sm border">
                        <div className={cn("flex items-center gap-2 font-black uppercase text-[10px] tracking-widest", policy.color)}>
                            <policy.icon className="h-3 w-3" />
                            {policy.role}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{policy.desc}</p>
                    </div>
                ))}
                </CardContent>
            </Card>
          </div>
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
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-muted/30 p-8 border-b">
             <DialogHeader>
                <DialogTitle className="text-3xl font-headline">{editingUser ? 'Refine Artisan' : 'Register New Artisan'}</DialogTitle>
                <DialogDescription>Define identity and base clearance level.</DialogDescription>
             </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[75vh]">
            <div className="p-8 space-y-10">
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-10">
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

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                       <UserIcon className="h-3 w-3" /> Identity Matrix
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={userForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Full Legal Name</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={userForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Workplace Email</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={userForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Secure Access Key</FormLabel>
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
                              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={userForm.control} name="role" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase text-[9px] font-black tracking-widest text-muted-foreground">Base Clearance Level</FormLabel>
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
                  </div>

                  <div className="pt-6 flex gap-4">
                     <DialogClose asChild><Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Discard</Button></DialogClose>
                     <Button type="submit" disabled={isSavingUser} className="flex-2 px-12 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20">
                       {isSavingUser ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                       Commit Artisan Data
                     </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToDelete} onOpenChange={(o) => { if(!o) { setItemToDelete(null); setDeleteInput(''); } }}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-destructive/10 p-8 border-b border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-3 text-destructive">
                <ShieldAlert className="h-8 w-8" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-stone-600 font-medium">
                Are you sure you want to remove <strong className="text-stone-900">{itemToDelete?.name}</strong> from the team?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Security Verification</Label>
              <p className="text-xs text-stone-500 italic">Type the word <span className="font-bold text-destructive underline">delete</span> manually to authorize removal.</p>
              <Input 
                placeholder="Type here..." 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="h-14 rounded-2xl border-2 border-stone-200 focus:border-destructive/40 focus:ring-destructive/10 text-center text-lg font-bold tracking-widest"
              />
            </div>
            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setItemToDelete(null)} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" disabled={isDeleting}>Abort</Button>
               <Button 
                variant="destructive" 
                className="flex-2 px-10 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-destructive/20" 
                disabled={deleteInput.toLowerCase() !== 'delete' || isDeleting}
                onClick={confirmDeleteUser}
               >
                 {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Final Destroy'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}