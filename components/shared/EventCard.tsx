import { formatMajorAmount } from "@/lib/money";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Globe, Zap } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
    event: {
        id: string;
        title: string;
        description: string;
        image: string | null;
        startDateTime: Date;
        location: string;
        eventType: "ONLINE" | "OFFLINE" | "HYBRID";
        visibility: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
        maxAttendees: number | null;
        attendeeCount: number;
        isFree: boolean;
        price: string | null;
        currency?: string | null;
        organization?: {
            id: string;
            name: string;
            logo: string | null;
        } | null;
        category: {
            id: string;
            label: string;
        };
    };
    variant?: "compact" | "full";
}

const EventCard = ({ event, variant = "full" }: EventCardProps) => {
    const getEventTypeBadge = () => {
        const types = {
            ONLINE: { label: "Online", icon: Globe, color: "bg-nx-secondary-container text-nx-on-secondary-container" },
            OFFLINE: { label: "In-Person", icon: MapPin, color: "bg-nx-success-container text-nx-on-success-container" },
            HYBRID: { label: "Hybrid", icon: Zap, color: "bg-nx-tertiary-container text-nx-on-tertiary-container" },
        };

        const type = types[event.eventType];
        const Icon = type.icon;

        return (
            <Badge className={`${type.color} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {type.label}
            </Badge>
        );
    };

    const getCapacityInfo = () => {
        if (!event.maxAttendees) return null;

        const spotsLeft = event.maxAttendees - event.attendeeCount;
        const percentageFull = (event.attendeeCount / event.maxAttendees) * 100;

        return (
            <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-nx-on-surface-variant" />
                <span className={spotsLeft < 10 ? "text-nx-warning font-medium" : "text-nx-on-surface-variant"}>
                    {event.attendeeCount}/{event.maxAttendees} spots filled
                </span>
                {spotsLeft === 0 && (
                    <Badge variant="destructive" className="ml-2">Full</Badge>
                )}
            </div>
        );
    };

    return (
        <Link href={`/events/${event.id}`}>
            <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest shadow-nx-card transition-all hover:shadow-nx-float">
                {/* Event Image */}
                <div className="relative h-48 w-full overflow-hidden bg-nx-surface-container-high">
                    {event.image ? (
                        <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-nx-secondary-container to-nx-primary-container">
                            <Calendar className="h-16 w-16 text-nx-primary" />
                        </div>
                    )}

                    {/* Event Type Badge */}
                    <div className="absolute top-3 right-3">
                        {getEventTypeBadge()}
                    </div>
                </div>

                {/* Event Content */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                    {/* Category */}
                    <Badge variant="outline" className="w-fit">
                        {event.category.label}
                    </Badge>

                    {/* Title */}
                    <h3 className="font-headline text-xl font-bold text-nx-on-surface line-clamp-2 group-hover:text-nx-primary transition-colors">
                        {event.title}
                    </h3>

                    {/* Description */}
                    {variant === "full" && (
                        <p className="text-nx-on-surface-variant text-sm line-clamp-2">
                            {event.description}
                        </p>
                    )}

                    {/* Date and Location */}
                    <div className="flex flex-col gap-2 text-sm text-nx-on-surface-variant">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-nx-on-surface-variant" />
                            <span>{format(new Date(event.startDateTime), "MMM dd, yyyy · h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-nx-on-surface-variant" />
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    </div>

                    {/* Capacity Info */}
                    {getCapacityInfo()}

                    {/* Organization */}
                    {event.organization && (
                        <div className="flex items-center gap-2 pt-3 border-t border-nx-outline-variant/30">
                            {event.organization.logo ? (
                                <Image
                                    src={event.organization.logo}
                                    alt={event.organization.name}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-nx-secondary-container flex items-center justify-center">
                                    <span className="text-xs font-semibold text-nx-on-secondary-container">
                                        {event.organization.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <span className="text-sm text-nx-on-surface-variant">
                                Hosted by <span className="font-medium text-nx-on-surface">{event.organization.name}</span>
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="mt-auto pt-3">
                        {event.isFree ? (
                            <Badge className="bg-nx-success-container text-nx-on-success-container">Free</Badge>
                        ) : (
                            <span className="text-lg font-bold text-nx-primary">
                                {formatMajorAmount(event.price ?? "0", event.currency ?? "USD")}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;
