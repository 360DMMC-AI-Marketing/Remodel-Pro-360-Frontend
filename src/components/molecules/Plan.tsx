import clsx from "clsx"
import { Button } from "../atoms/Button";

type Props = {
    data: {
        name: string;
        price: number | "custom";
        audience: string;
        features: string[];
        action: string;
    },
    mostPopular?: boolean;
    hoverable?: boolean;
    className?: string;
}

const Plan = (props: Props) => {
  return (
    <div className={clsx('card relative', props.hoverable && 'card-hover', props.mostPopular && 'border-2 border-primary-600 py-8', props.className)}>
        {props.mostPopular && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </div>
        )}
        <h3 className="text-xl font-bold mb-2">{props.data.name}</h3>
        <div>
            {props.data.price === "custom" ? (
                <p className="text-3xl font-bold mb-5">Custom</p>
            ) : (
                <span className="text-4xl font-bold mb-5">${props.data.price}<span className="text-base font-medium text-neutral-600">/month</span> </span>
            )}
        </div>
        <p className="text-gray-600 mb-4">{props.data.audience}</p>
        <ul className="mb-6">
          {props.data.features.map((feature, index) => (
            <li key={index} className="flex items-center mb-2">
              <span className="text-green-500 mr-2">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Button variant={props.mostPopular ? "primary" : "outline"} size="md" className="w-full">
          {props.data.action}
        </Button>
    </div>
  )
}

export default Plan