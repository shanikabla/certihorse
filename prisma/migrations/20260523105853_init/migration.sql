-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SELLER', 'BUYER', 'VET', 'ADMIN');

-- CreateEnum
CREATE TYPE "VetVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "HorseIdentityStatus" AS ENUM ('UNVERIFIED', 'VERIFIED_BY_VET', 'VERIFIED_BY_ADMIN', 'VERIFIED_BY_API');

-- CreateEnum
CREATE TYPE "HorseSex" AS ENUM ('MALE', 'FEMALE', 'GELDING');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED', 'SOLD');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('DRESSAGE', 'SHOW_JUMPING', 'EVENTING', 'ENDURANCE', 'WESTERN', 'RACING', 'LEISURE', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('PURCHASE_EXAM', 'ROUTINE', 'FOLLOW_UP', 'IMAGING_ONLY');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VetOpinion" AS ENUM ('FAVORABLE', 'FAVORABLE_WITH_RESERVES', 'UNFAVORABLE', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "MedicalFileKind" AS ENUM ('RADIOGRAPH', 'PDF_REPORT', 'PHOTO', 'LAB_RESULT', 'OTHER');

-- CreateEnum
CREATE TYPE "ShareScope" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ShareConsentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ShareAccessAction" AS ENUM ('DOSSIER_VIEW', 'FILE_DOWNLOAD');

-- CreateEnum
CREATE TYPE "SportResultSource" AS ENUM ('FFE', 'SHF', 'MANUAL_VERIFIED', 'OTHER');

-- CreateEnum
CREATE TYPE "CertificationTier" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('VET_PRO', 'SELLER_PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SHARE_REQUEST', 'SHARE_GRANTED', 'SHARE_DENIED', 'SHARE_REVOKED', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "locale" TEXT NOT NULL DEFAULT 'fr-FR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VetProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ordreNumber" TEXT NOT NULL,
    "verificationStatus" "VetVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "specialties" TEXT[],
    "regionCode" TEXT,
    "city" TEXT,
    "bio" TEXT,
    "independent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VetProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Horse" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chipNumber" TEXT,
    "sireNumber" TEXT,
    "identityStatus" "HorseIdentityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "identityVerifiedAt" TIMESTAMP(3),
    "identityVerifiedById" TEXT,
    "identityVerifiedMethod" TEXT,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "color" TEXT,
    "sex" "HorseSex",
    "birthDate" TIMESTAMP(3),
    "heightCm" INTEGER,

    CONSTRAINT "Horse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discipline" "Discipline",
    "level" TEXT,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "commissionerId" TEXT NOT NULL,
    "type" "VisitType" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'REQUESTED',
    "vetIndependent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetDossier" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "previousVersionId" TEXT,
    "supersededAt" TIMESTAMP(3),
    "examGeneral" TEXT,
    "examLocomotor" TEXT,
    "conclusion" TEXT,
    "opinion" "VetOpinion",
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalFile" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "kind" "MedicalFileKind" NOT NULL,
    "zone" TEXT,
    "r2Key" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareConsent" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "grantorId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "scope" "ShareScope" NOT NULL DEFAULT 'FULL',
    "partialNote" TEXT,
    "status" "ShareConsentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ShareConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareAccessLog" (
    "id" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "action" "ShareAccessAction" NOT NULL,
    "fileId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportResult" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "source" "SportResultSource" NOT NULL,
    "externalRef" TEXT,
    "competition" TEXT NOT NULL,
    "discipline" "Discipline",
    "category" TEXT,
    "rank" INTEGER,
    "score" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SportResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "tier" "CertificationTier" NOT NULL DEFAULT 'NONE',
    "pillarIdentity" BOOLEAN NOT NULL DEFAULT false,
    "pillarVet" BOOLEAN NOT NULL DEFAULT false,
    "pillarSport" BOOLEAN NOT NULL DEFAULT false,
    "pillarConsent" BOOLEAN NOT NULL DEFAULT false,
    "recomputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "dossierId" TEXT,
    "consentId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "VetProfile_userId_key" ON "VetProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VetProfile_ordreNumber_key" ON "VetProfile"("ordreNumber");

-- CreateIndex
CREATE INDEX "VetProfile_verificationStatus_idx" ON "VetProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "VetProfile_regionCode_idx" ON "VetProfile"("regionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Horse_chipNumber_key" ON "Horse"("chipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Horse_sireNumber_key" ON "Horse"("sireNumber");

-- CreateIndex
CREATE INDEX "Horse_ownerId_idx" ON "Horse"("ownerId");

-- CreateIndex
CREATE INDEX "Horse_identityStatus_idx" ON "Horse"("identityStatus");

-- CreateIndex
CREATE INDEX "Listing_horseId_idx" ON "Listing"("horseId");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Visit_horseId_idx" ON "Visit"("horseId");

-- CreateIndex
CREATE INDEX "Visit_vetId_idx" ON "Visit"("vetId");

-- CreateIndex
CREATE INDEX "Visit_commissionerId_idx" ON "Visit"("commissionerId");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VetDossier_previousVersionId_key" ON "VetDossier"("previousVersionId");

-- CreateIndex
CREATE INDEX "VetDossier_visitId_idx" ON "VetDossier"("visitId");

-- CreateIndex
CREATE INDEX "VetDossier_horseId_idx" ON "VetDossier"("horseId");

-- CreateIndex
CREATE INDEX "VetDossier_ownerId_idx" ON "VetDossier"("ownerId");

-- CreateIndex
CREATE INDEX "VetDossier_authorId_idx" ON "VetDossier"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalFile_r2Key_key" ON "MedicalFile"("r2Key");

-- CreateIndex
CREATE INDEX "MedicalFile_dossierId_idx" ON "MedicalFile"("dossierId");

-- CreateIndex
CREATE INDEX "ShareConsent_dossierId_idx" ON "ShareConsent"("dossierId");

-- CreateIndex
CREATE INDEX "ShareConsent_grantorId_idx" ON "ShareConsent"("grantorId");

-- CreateIndex
CREATE INDEX "ShareConsent_granteeId_idx" ON "ShareConsent"("granteeId");

-- CreateIndex
CREATE INDEX "ShareConsent_status_idx" ON "ShareConsent"("status");

-- CreateIndex
CREATE INDEX "ShareAccessLog_consentId_idx" ON "ShareAccessLog"("consentId");

-- CreateIndex
CREATE INDEX "ShareAccessLog_granteeId_idx" ON "ShareAccessLog"("granteeId");

-- CreateIndex
CREATE INDEX "SportResult_horseId_idx" ON "SportResult"("horseId");

-- CreateIndex
CREATE INDEX "SportResult_source_idx" ON "SportResult"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_horseId_key" ON "Certification"("horseId");

-- CreateIndex
CREATE INDEX "Certification_tier_idx" ON "Certification"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Conversation_buyerId_idx" ON "Conversation"("buyerId");

-- CreateIndex
CREATE INDEX "Conversation_sellerId_idx" ON "Conversation"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_buyerId_sellerId_listingId_key" ON "Conversation"("buyerId", "sellerId", "listingId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetProfile" ADD CONSTRAINT "VetProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horse" ADD CONSTRAINT "Horse_identityVerifiedById_fkey" FOREIGN KEY ("identityVerifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_commissionerId_fkey" FOREIGN KEY ("commissionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetDossier" ADD CONSTRAINT "VetDossier_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetDossier" ADD CONSTRAINT "VetDossier_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetDossier" ADD CONSTRAINT "VetDossier_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetDossier" ADD CONSTRAINT "VetDossier_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetDossier" ADD CONSTRAINT "VetDossier_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "VetDossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFile" ADD CONSTRAINT "MedicalFile_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "VetDossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareConsent" ADD CONSTRAINT "ShareConsent_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "VetDossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareConsent" ADD CONSTRAINT "ShareConsent_grantorId_fkey" FOREIGN KEY ("grantorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareConsent" ADD CONSTRAINT "ShareConsent_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAccessLog" ADD CONSTRAINT "ShareAccessLog_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "ShareConsent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAccessLog" ADD CONSTRAINT "ShareAccessLog_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportResult" ADD CONSTRAINT "SportResult_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
