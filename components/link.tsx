import NextLink from "next/link"
import type { ComponentProps } from "react"

export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink href={href} {...props} />
}

