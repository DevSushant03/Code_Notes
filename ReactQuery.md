# React Query (TanStack) Notes

---

STEP:1 Install package

npm i @tanstack/react-query

---

STEP:2 Main.jsx setup

import { QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient(); // create a instance

<QueryClientProvider client={queryClient}>
  // routes
</QueryClientProvider>

---

Assume:

const getUserData = ()=>{
  return await api.get("userData");
}

---

STEP:3 Fetch Data

const {data}= useQuery({  
  // data is by default key provided by tanStack
  queryKey:['userData'],
  queryFn: getUserData
})

---

STEP:4 Loading & error handling

const {data,isPending, isError , error}= useQuery({  
  // isPending, isError , error is by default key provided by tanStack
  queryKey:['userData'],
  queryFn: getUserData
})

---

STEP:5 ReactQuery Dev Tool

npm i @tanstack/react-query-devtools

import {ReactQueryDevtools} from "@tanstack/react-query-devtools"

<ReactQueryDevtools initialIsOpen={false}/>

---
