import { Lock } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white flex size-8 items-center justify-center rounded-lg">
              <Lock className="size-4" />
            </div>
            ProUltima
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">ProUltima</h2>
            <p className="text-muted-foreground max-w-md">
              Task Management System - Streamline your workflow and boost productivity
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
