'use client'

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomInputForm from "./custom-input"
import { authFormSchema } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { signIn, signUp } from "@/lib/actions/user.actions"
import PlaidLink from "./plaid-link"

const AuthForm = ({type}: {type:string}) => {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const formSchema = authFormSchema(type)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: ''
        },
    });


    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        
        try {
            if(type === 'sign-up') {
                const userProfile = {
                    firstName: data.firstName!,
                    lastName: data.lastName!,
                    email: data.email!,
                    phone: data.phone!,
                }

                const newUser = await signUp({
                    ...userProfile,
                    password: data.password!
                })

                if (newUser?.errors) {
                    // Set errors on specific fields
                    newUser.errors.forEach((err: { field: string; message: string }) => {
                        form.setError(err.field as any, {
                            type: 'manual',
                            message: err.message
                        })
                    })
                    return
                }

                if (newUser?.error) {
                    form.setError('root', {
                        type: 'manual',
                        message: newUser.error
                    })
                    return
                }

                if (newUser?.$id) {
                    setUser({
                        ...userProfile,
                        $id: newUser.$id,
                        userId: newUser.$id,
                        name: newUser.name ?? `${userProfile.firstName} ${userProfile.lastName}`,
                    })
                }
            }
            if(type === 'sign-in') {
                const response = await signIn({
                    email: data.email,
                    password: data.password
                })

                if(response) router.push('/')
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

  return (
    <section className='auth-form'>
        <header className='flex flex-col gap-5 md:gap-8'>
            <Link
            href="/"
            className="cursor-pointer flex items-center gap-1"
          >
            <Image src="/icons/logo.svg" width={34} height={34} alt="Logo" />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
              Aureon
            </h1>
          </Link>

          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-24 lg:text-36 font-semibold text-gray-900">
                {user ? 'Link Account' : type === 'sign-in' ? 'Sign In' : 'Create an Account'}
                <p className="text-16 font-normal text-gray-600">
                    {user ? 'Link your account to get started.' : 'Please enter your details'}
                </p>
            </h1>
          </div>
        </header>
        {user ? (
            <div className="flex flex-col gap-4">
                <PlaidLink user={user} variant='primary'/>
            </div>
        ): (
            <>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {type === 'sign-up' && (
                            <>
                                <div className="flex gap-4">
                                    <CustomInputForm control={form.control} name='firstName' label='First Name' placeholder="Enter your first name" />
                                    <CustomInputForm control={form.control} name='lastName' label='Last Name' placeholder="Enter your last name" />
                                </div>
                                <CustomInputForm control={form.control} name='phone' label='Phone Number' placeholder="Enter your phone number" />
                            </>
                        )}
                        <CustomInputForm control={form.control} name='email' label='Email' placeholder='Enter your Email' />
                        <CustomInputForm control={form.control} name='password' label='Password' placeholder='Enter your Password' />
                        <div className="flex flex-col gap-4">
                            <Button type="submit" className="form-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin"/>
                                        Loading...
                                    </>
                                ): type === 'sign-in' ? 'Sign In' : 'Sign Up'
                                }   
                            </Button>
                        </div>
                    </form>
                </Form>

                <footer className="flex justify-center gap-1">
                    <p className="text-14 font-normal text-gray-600">
                        {type === 'sign-in' ? "Don't have an account? " : "Already have an account? "}
                        <Link href={type === 'sign-in' ? '/sign-up' : '/sign-in'} className="form-link">
                            {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
                        </Link>
                    </p>
                </footer>
            </>
        )}
    </section>
  )
}

export default AuthForm