# UI Quick Reference Guide

## 🎨 Visual Improvements at a Glance

### Dashboard Overview
**Before:** Basic cards with simple styling  
**After:** Modern cards with:
- Hover lift animations (`hover:-translate-y-1`)
- Shadow effects (`hover:shadow-lg`)
- Color-coded left borders (`border-l-4 border-l-[color]`)
- Icon backgrounds with scale effects
- Gradient accents

### Key CSS Classes Used

#### Card Enhancements
```css
/* Hover effect card */
className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"

/* Card with colored border */
className="border-l-4 border-l-green-500"

/* Icon background */
className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform"
```

#### Gradient Elements
```css
/* Gradient button */
className="bg-gradient-to-r from-blue-600 to-purple-600"

/* Gradient text */
className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text"

/* Gradient accent bar */
className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"
```

#### Status Badges
```css
/* Success badge */
<Badge className="bg-green-600 font-semibold">✓ Submitted</Badge>

/* Warning badge */
<Badge variant="warning" className="font-semibold">🔍 Investigating</Badge>

/* Error badge */
<Badge variant="destructive" className="font-semibold">⚠ Reported</Badge>
```

## 🎯 Color Coding System

| Color | Usage | Example |
|-------|-------|---------|
| **Blue** | Primary, Agents, General | `text-blue-600 dark:text-blue-400` |
| **Green** | Success, Submitted | `text-green-600 dark:text-green-400` |
| **Red** | Critical, Incidents | `text-red-600 dark:text-red-400` |
| **Orange** | Pending, Warnings | `text-orange-600 dark:text-orange-400` |
| **Purple** | Metrics, Special | `text-purple-600 dark:text-purple-400` |
| **Yellow** | Investigating | `text-yellow-600 dark:text-yellow-400` |

## 🔄 Animation Classes

### Hover Effects
- `hover:-translate-y-1` - Lift up on hover
- `hover:shadow-lg` - Increase shadow
- `hover:scale-110` - Scale up 10%
- `hover:scale-[1.01]` - Subtle scale
- `hover:scale-105` - Scale up 5%

### Transitions
- `transition-all duration-300` - Smooth all properties
- `transition-colors` - Color transitions only
- `transition-shadow` - Shadow transitions only
- `transition-transform` - Transform only

### Custom Animations
- `animate-pulse` - Pulsing effect (Live badge)
- `animate-spin` - Spinning (Loading)
- `animate-blob` - Custom blob animation (Login page)

## 📱 Responsive Grid Patterns

### Statistics Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

### Two Column Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Charts */}
</div>
```

## 🎭 Dark Mode Support

All components support dark mode with:
- `dark:bg-gray-800` - Dark backgrounds
- `dark:text-gray-100` - Dark text
- `dark:border-gray-700` - Dark borders
- `dark:hover:bg-gray-700` - Dark hover states

## 🚀 Quick Copy-Paste Components

### Modern Stat Card
```tsx
<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Label</p>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">Value</p>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Enhanced Table Row
```tsx
<TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
  {/* Cells */}
</TableRow>
```

### Gradient Button
```tsx
<Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
  Click Me
</Button>
```

### Card with Accent Bar
```tsx
<Card className="hover:shadow-lg transition-shadow duration-300">
  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
    <CardTitle className="flex items-center gap-2">
      <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
      Title
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    {/* Content */}
  </CardContent>
</Card>
```

## 🎨 Icon Patterns

### Icon with Background
```tsx
<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform">
  <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
</div>
```

### User Avatar
```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
  {initials}
</div>
```

## 📊 Progress Indicator
```tsx
<div className="flex items-center gap-2">
  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
    <div 
      className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
      style={{ width: `${percentage}%` }}
    />
  </div>
  <span className="text-xs font-semibold">{percentage}%</span>
</div>
```

## 🔍 Search Input with Icon
```tsx
<div className="relative">
  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
  <Input
    placeholder="Search..."
    className="pl-10"
  />
</div>
```

## 💡 Pro Tips

1. **Always use `group` class** on parent for child hover effects
2. **Combine transitions** for smooth animations
3. **Use dark mode classes** for all color properties
4. **Add hover states** to all interactive elements
5. **Keep animations subtle** (300ms is ideal)
6. **Use gradients sparingly** for emphasis
7. **Test in both light and dark modes**

## 🐛 Common Issues

### Issue: Animations not working
**Solution:** Ensure parent has `group` class and child has `group-hover:`

### Issue: Dark mode colors wrong
**Solution:** Always add both light and dark variants: `text-blue-600 dark:text-blue-400`

### Issue: Hover not smooth
**Solution:** Add `transition-all duration-300` or specific transition

---

**Quick Start:** Copy any component pattern above and customize colors/content!
