-- CreateTable "PencilStroke"
CREATE TABLE "PencilStroke" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "pathData" JSONB NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "width" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PencilStroke_pkey" PRIMARY KEY ("id")
);

-- CreateTable "TextItem"
CREATE TABLE "TextItem" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "fontSize" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PencilStroke" ADD CONSTRAINT "PencilStroke_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PencilStroke" ADD CONSTRAINT "PencilStroke_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextItem" ADD CONSTRAINT "TextItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextItem" ADD CONSTRAINT "TextItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
