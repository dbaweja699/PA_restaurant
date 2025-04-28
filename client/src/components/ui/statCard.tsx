import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  footer: React.ReactNode;
  footerLink?: {
    text: string;
    href: string;
  };
}

export function StatCard({
  icon,
  iconBgColor,
  title,
  value,
  footer,
  footerLink
}: StatCardProps) {
  return (
    <Card className="overflow-hidden bg-white border border-gray-100 shadow-sm">
      <CardContent className="px-6 py-7 sm:p-8">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <i className={`${icon} text-xl text-white`}></i>
          </div>
          <div className="ml-6 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate mb-1">
                {title}
              </dt>
              <dd>
                <div className="text-xl font-semibold text-neutral-900">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-neutral-50 px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-accent font-medium">
          {footer}
        </div>
        {footerLink && (
          <a 
            href={footerLink.href} 
            className="text-secondary-dark hover:text-secondary-light text-sm font-medium"
          >
            {footerLink.text}
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
